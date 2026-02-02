import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string; // Hashed password for email/password auth
  name?: string;
  image?: string; // For Google OAuth profile picture
  emailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }, // unique: true automatically creates an index
    password: { type: String, select: false }, // Don't return password by default
    name: { type: String },
    image: { type: String },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// No need for explicit index - unique: true already creates one

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
