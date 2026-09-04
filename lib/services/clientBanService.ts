import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import BannedClient, { type IBannedClient } from '@/lib/models/BannedClient';
import Customer from '@/lib/models/Customer';
import { ForbiddenError, ValidationError } from '@/lib/apiError';
import {
  CLIENT_BAN_ADMIN_MESSAGE,
  CLIENT_BAN_PUBLIC_MESSAGE,
  identitiesMatch,
  identityHasMatchableField,
  normalizeEmail,
  normalizeName,
  normalizeSocial,
  phoneMatchKey,
  type ClientIdentity,
} from '@/lib/utils/clientBan';

export type BanActor = {
  id?: string;
  name?: string | null;
  email?: string | null;
};

export type BanInput = ClientIdentity & {
  reason?: string;
};

function toBanQuery(identity: ClientIdentity): Record<string, unknown>[] {
  const or: Record<string, unknown>[] = [];
  if (identity.customerId) or.push({ customerId: String(identity.customerId) });
  const nameNormalized = normalizeName(identity.name);
  const emailNormalized = normalizeEmail(identity.email);
  const phoneKey = phoneMatchKey(identity.phone);
  const socialNormalized = normalizeSocial(identity.socialMediaName);
  if (nameNormalized) or.push({ nameNormalized });
  if (emailNormalized) or.push({ emailNormalized });
  if (phoneKey) or.push({ phoneKey });
  if (socialNormalized) or.push({ socialNormalized });
  return or;
}

function serializeBan(ban: IBannedClient | Record<string, unknown>) {
  const doc = ban as IBannedClient & { _id: mongoose.Types.ObjectId };
  return {
    id: String(doc._id),
    customerId: doc.customerId || null,
    name: doc.name || null,
    email: doc.email || null,
    phone: doc.phone || null,
    socialMediaName: doc.socialMediaName || null,
    reason: doc.reason || null,
    isActive: doc.isActive !== false,
    bannedByName: doc.bannedByName || null,
    bannedByEmail: doc.bannedByEmail || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function findMatchingBan(identity: ClientIdentity) {
  if (!identityHasMatchableField(identity)) return null;

  await connectDB();
  const or = toBanQuery(identity);
  if (or.length > 0) {
    const ban = await BannedClient.findOne({ isActive: true, $or: or }).lean();
    if (ban) return ban;
  }

  if (identity.customerId && mongoose.Types.ObjectId.isValid(identity.customerId)) {
    const customer = await Customer.findById(identity.customerId).lean();
    if (customer && customer.isActive === false) return { customerId: String(customer._id), fromCustomer: true };
  }

  const inactive = await Customer.find({ isActive: false })
    .select('name email phone socialMediaName')
    .lean();
  const matched = inactive.find((customer) =>
    identitiesMatch(identity, {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      socialMediaName: customer.socialMediaName,
    })
  );
  if (matched) return { customerId: String(matched._id), fromCustomer: true };
  return null;
}

export async function assertNotBanned(identity: ClientIdentity, options?: { admin?: boolean }) {
  const ban = await findMatchingBan(identity);
  if (ban) {
    throw new ForbiddenError(options?.admin ? CLIENT_BAN_ADMIN_MESSAGE : CLIENT_BAN_PUBLIC_MESSAGE);
  }
}

export async function listBannedClients() {
  await connectDB();
  const bans = await BannedClient.find({ isActive: true }).sort({ createdAt: -1 }).lean();
  return bans.map(serializeBan);
}

export async function banClient(input: BanInput, actor?: BanActor) {
  await connectDB();

  let name = input.name?.trim() || undefined;
  let email = input.email?.trim() || undefined;
  let phone = input.phone?.trim() || undefined;
  let socialMediaName = input.socialMediaName?.trim() || undefined;
  let customerId = input.customerId || undefined;

  if (customerId) {
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      throw new ValidationError('Customer not found');
    }
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new ValidationError('Customer not found');
    }
    name = name || customer.name;
    email = email || customer.email;
    phone = phone || customer.phone;
    socialMediaName = socialMediaName || customer.socialMediaName;
  }

  const identity: ClientIdentity = { customerId, name, email, phone, socialMediaName };
  if (!identityHasMatchableField(identity)) {
    throw new ValidationError('Enter a name, email, phone, or social media name to ban');
  }

  const reason = input.reason?.trim() || undefined;
  const nameNormalized = normalizeName(name);
  const emailNormalized = normalizeEmail(email);
  const phoneKey = phoneMatchKey(phone);
  const socialNormalized = normalizeSocial(socialMediaName);

  const existingQuery = toBanQuery(identity);
  const existing = existingQuery.length
    ? await BannedClient.findOne({ isActive: true, $or: existingQuery })
    : null;

  const payload = {
    customerId,
    name,
    email: email ? email.toLowerCase() : undefined,
    phone,
    socialMediaName,
    nameNormalized: nameNormalized || undefined,
    emailNormalized: emailNormalized || undefined,
    phoneKey: phoneKey || undefined,
    socialNormalized: socialNormalized || undefined,
    reason,
    isActive: true,
    bannedByUserId: actor?.id,
    bannedByName: actor?.name || undefined,
    bannedByEmail: actor?.email || undefined,
  };

  const ban = existing
    ? await BannedClient.findByIdAndUpdate(existing._id, { $set: payload }, { new: true })
    : await BannedClient.create(payload);

  if (customerId) {
    await Customer.findByIdAndUpdate(customerId, {
      $set: {
        isActive: false,
        bannedAt: new Date(),
        bannedReason: reason,
      },
    });
  }

  return serializeBan(ban!);
}

export async function unbanClient(banId: string) {
  await connectDB();
  const ban = await BannedClient.findById(banId);
  if (!ban || ban.isActive === false) {
    throw new ValidationError('Ban record not found');
  }

  ban.isActive = false;
  await ban.save();

  if (ban.customerId && mongoose.Types.ObjectId.isValid(ban.customerId)) {
    const stillBanned = await BannedClient.exists({
      _id: { $ne: ban._id },
      customerId: ban.customerId,
      isActive: true,
    });
    if (!stillBanned) {
      await Customer.findByIdAndUpdate(ban.customerId, {
        $set: { isActive: true },
        $unset: { bannedAt: 1, bannedReason: 1 },
      });
    }
  }

  return serializeBan(ban);
}

export async function unbanCustomer(customerId: string) {
  await connectDB();
  await BannedClient.updateMany({ customerId, isActive: true }, { $set: { isActive: false } });
  await Customer.findByIdAndUpdate(customerId, {
    $set: { isActive: true },
    $unset: { bannedAt: 1, bannedReason: 1 },
  });
}

export async function syncBanSnapshot(customerId: string, identity: ClientIdentity) {
  await connectDB();
  await BannedClient.updateMany(
    { customerId, isActive: true },
    {
      $set: {
        name: identity.name || undefined,
        email: identity.email ? String(identity.email).toLowerCase() : undefined,
        phone: identity.phone || undefined,
        socialMediaName: identity.socialMediaName || undefined,
        nameNormalized: normalizeName(identity.name) || undefined,
        emailNormalized: normalizeEmail(identity.email) || undefined,
        phoneKey: phoneMatchKey(identity.phone) || undefined,
        socialNormalized: normalizeSocial(identity.socialMediaName) || undefined,
      },
    }
  );
}
