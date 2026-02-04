import { NailTech, NailTechInput, ServiceAvailability } from '../types';
import connectDB from '../mongodb';
import NailTechModel, { INailTech } from '../models/NailTech';

// Helper function to ensure name doesn't have "Ms." prefix (store without prefix)
function normalizeName(name: string): string {
  const trimmed = name.trim();
  // Remove "Ms." prefix if present (case insensitive)
  if (trimmed.toLowerCase().startsWith('ms.')) {
    return trimmed.substring(3).trim();
  }
  return trimmed;
}

export async function listNailTechs(): Promise<NailTech[]> {
  await connectDB();
  const docs = await NailTechModel.find().sort({ name: 1 }).lean<INailTech[]>();
  return docs.map((doc) => docToNailTech(doc));
}

export async function listActiveNailTechs(): Promise<NailTech[]> {
  await connectDB();
  const docs = await NailTechModel.find({ status: 'Active' }).sort({ name: 1 }).lean<INailTech[]>();
  return docs.map((doc) => docToNailTech(doc));
}

export async function getNailTechById(id: string): Promise<NailTech | null> {
  await connectDB();
  const doc = await NailTechModel.findById(id).lean<INailTech | null>();
  if (!doc) return null;
  return docToNailTech(doc);
}

export async function getDefaultNailTech(): Promise<NailTech | null> {
  await connectDB();

  // Prefer the Owner if active
  let doc = await NailTechModel.findOne({ role: 'Owner', status: 'Active' })
    .sort({ createdAt: 1 })
    .lean<INailTech | null>();

  // Fallback to any active tech
  if (!doc) {
    doc = await NailTechModel.findOne({ status: 'Active' })
      .sort({ createdAt: 1 })
      .lean<INailTech | null>();
  }

  return doc ? docToNailTech(doc) : null;
}

export async function createNailTech(payload: NailTechInput): Promise<NailTech> {
  await connectDB();
  // Normalize name to remove "Ms." prefix if present (we'll add it on display)
  const normalizedName = normalizeName(payload.name);
  // Convert "Both" to "Studio and Home Service" for backward compatibility
  const serviceAvailability = (payload.serviceAvailability as string) === 'Both' 
    ? 'Studio and Home Service' 
    : payload.serviceAvailability;
  const data = {
    ...payload,
    name: normalizedName,
    serviceAvailability: serviceAvailability as ServiceAvailability,
  };

  const doc = await NailTechModel.create(data);
  return docToNailTech(doc.toObject());
}

export async function updateNailTech(id: string, updates: Partial<NailTechInput>): Promise<NailTech> {
  await connectDB();

  const updateData: Partial<NailTechInput> = {
    ...updates,
  };
  
  // Normalize name if provided
  if (updateData.name) {
    updateData.name = normalizeName(updateData.name);
  }
  
  // Convert "Both" to "Studio and Home Service" if present
  if ((updateData.serviceAvailability as string) === 'Both') {
    updateData.serviceAvailability = 'Studio and Home Service' as ServiceAvailability;
  }
  
  const doc = await NailTechModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean<INailTech | null>();

  if (!doc) {
    throw new Error('Nail tech not found.');
  }

  return docToNailTech(doc);
}

export async function deleteNailTech(id: string): Promise<void> {
  await connectDB();
  await NailTechModel.findByIdAndUpdate(id, { status: 'Inactive' }).lean();
}

export async function createDefaultNailTech(): Promise<NailTech> {
  // Check if default already exists
  const existing = await getDefaultNailTech();
  if (existing && existing.name.toLowerCase().includes('jhen')) {
    return existing;
  }

  const defaultTech: NailTechInput = {
    name: 'Jhen', // Store without "Ms." prefix
    role: 'Owner',
    serviceAvailability: 'Studio and Home Service',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    status: 'Active',
  };

  return createNailTech(defaultTech);
}

function docToNailTech(doc: INailTech | (INailTech & { _id?: any })): NailTech {
  const data: any = doc;

  // Handle backward compatibility: support both 'name' and 'fullName' fields
  let name = data.name || data.fullName || '';
  name = normalizeName(name);

  // Handle backward compatibility: convert "Both" to "Studio and Home Service"
  let serviceAvailability = data.serviceAvailability;
  if ((serviceAvailability as string) === 'Both') {
    serviceAvailability = 'Studio and Home Service' as ServiceAvailability;
  }

  const createdAtValue = data.createdAt instanceof Date ? data.createdAt.toISOString() : data.createdAt;
  const updatedAtValue = data.updatedAt instanceof Date ? data.updatedAt.toISOString() : data.updatedAt;

  return {
    id: String(data._id ?? data.id),
    name,
    role: data.role,
    serviceAvailability: serviceAvailability as ServiceAvailability,
    workingDays: data.workingDays || [],
    discount: data.discount ?? undefined,
    commissionRate: data.commissionRate ?? undefined,
    status: data.status,
    createdAt: createdAtValue,
    updatedAt: updatedAtValue,
  };
}

