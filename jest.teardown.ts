import mongoose from 'mongoose';

export default async function globalTeardown() {
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
}

