import mongoose from 'mongoose';

function getMongoUri() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI in your .env.local file');
  }
  return MONGODB_URI;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global cache to prevent multiple connections in development
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
      retryWrites: true,
      retryReads: true,
    };

    cached.promise = mongoose
      .connect(getMongoUri(), opts)
      .then(async (mongoose) => {
        console.log('✅ MongoDB connected successfully');
        const { ensureIndexes } = await import('@/lib/db/ensureIndexes');
        await ensureIndexes();
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
        
        // Provide helpful error messages for common issues
        if (error.message?.includes('IP') || error.message?.includes('whitelist')) {
          console.error('\n🔒 IP Whitelist Issue Detected!');
          console.error('To fix this:');
          console.error('1. Go to MongoDB Atlas Dashboard');
          console.error('2. Navigate to Network Access (Security → Network Access)');
          console.error('3. Click "Add IP Address"');
          console.error('4. Add your current IP or use 0.0.0.0/0 for development (less secure)');
          console.error('5. Wait a few minutes for changes to propagate');
          console.error('\n📖 More info: https://www.mongodb.com/docs/atlas/security-whitelist/\n');
        } else if (error.message?.includes('authentication')) {
          console.error('\n🔐 Authentication Issue Detected!');
          console.error('Please check your MONGODB_URI connection string includes correct username and password');
        } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('DNS')) {
          console.error('\n🌐 DNS/Network Issue Detected!');
          console.error('Please check your internet connection and MongoDB Atlas cluster status');
        }
        
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
