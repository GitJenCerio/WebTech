import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  firebaseId?: string;
  email: string;
  password?: string; // Hashed password for email/password auth
  name?: string;
  image?: string; // For Google OAuth profile picture
  emailVerified?: boolean;
  role?: 'admin' | 'staff'; // User role
  assignedNailTechId?: string; // For staff members - assigned nail tech ID
  status?: 'active' | 'inactive'; // User status (plan: isActive = status === 'active')
  lastLogin?: Date; // Last successful login timestamp
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseId: { type: String, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    name: { type: String },
    image: { type: String },
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
    assignedNailTechId: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// No need for explicit index - unique: true already creates one

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
