export const CLIENT_BAN_PUBLIC_MESSAGE =
  "We're unable to complete a booking with these details. Please message our Facebook page if you need help.";

export const CLIENT_BAN_ADMIN_MESSAGE =
  'This client is banned and cannot be booked. Unban them first if this booking should proceed.';

export interface ClientIdentity {
  customerId?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  socialMediaName?: string | null;
}

export function normalizeName(value?: string | null): string | null {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return normalized.length >= 2 ? normalized : null;
}

export function normalizeEmail(value?: string | null): string | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized.includes('@') ? normalized : null;
}

/** Last 10 digits so +63 9xx and 09xx match. */
export function phoneMatchKey(value?: string | null): string | null {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

export function normalizeSocial(value?: string | null): string | null {
  let normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return null;
  normalized = normalized
    .replace(/^https?:\/\//, '')
    .replace(/^(www\.)?(facebook|fb|instagram|ig)\.com\//, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '')
    .replace(/\s+/g, ' ');
  return normalized.length >= 2 ? normalized : null;
}

export function identityHasMatchableField(identity: ClientIdentity): boolean {
  return Boolean(
    identity.customerId ||
      normalizeName(identity.name) ||
      normalizeEmail(identity.email) ||
      phoneMatchKey(identity.phone) ||
      normalizeSocial(identity.socialMediaName)
  );
}

export function identitiesMatch(submitted: ClientIdentity, stored: ClientIdentity): boolean {
  const submittedName = normalizeName(submitted.name);
  const storedName = normalizeName(stored.name);
  if (submittedName && storedName && submittedName === storedName) return true;

  const submittedEmail = normalizeEmail(submitted.email);
  const storedEmail = normalizeEmail(stored.email);
  if (submittedEmail && storedEmail && submittedEmail === storedEmail) return true;

  const submittedPhone = phoneMatchKey(submitted.phone);
  const storedPhone = phoneMatchKey(stored.phone);
  if (submittedPhone && storedPhone && submittedPhone === storedPhone) return true;

  const submittedSocial = normalizeSocial(submitted.socialMediaName);
  const storedSocial = normalizeSocial(stored.socialMediaName);
  if (submittedSocial && storedSocial && submittedSocial === storedSocial) return true;

  return false;
}
