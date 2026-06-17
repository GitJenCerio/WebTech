import mongoose from 'mongoose';
import dns from 'dns';

function configureDnsForAtlasSrv(uri: string) {
  if (!uri.startsWith('mongodb+srv://')) return;

  const custom = process.env.MONGODB_DNS_SERVERS
    ?.split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (custom?.length) {
    dns.setServers(custom);
    return;
  }

  // Some local routers reject Node SRV lookups (querySrv ECONNREFUSED) while nslookup works.
  if (process.env.NODE_ENV !== 'production') {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    dns.setDefaultResultOrder('ipv4first');
  }
}

function getMongoUri(): string {
  const useTestDb = process.env.USE_TEST_DB === 'true';
  if (useTestDb && process.env.MONGODB_URI_TEST) {
    return process.env.MONGODB_URI_TEST;
  }
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
    const uri = getMongoUri();
    configureDnsForAtlasSrv(uri);

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
      .connect(uri, opts)
      .then(async (mongoose) => {
        const dbName = uri.split('/').pop()?.split('?')[0] || 'unknown';
        console.log('✅ MongoDB connected successfully', process.env.USE_TEST_DB === 'true' ? `(test DB: ${dbName})` : '');
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
        } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('DNS') || error.message?.includes('querySrv')) {
          console.error('\n🌐 DNS/Network Issue Detected!');
          console.error('Atlas SRV lookup failed. Try one of:');
          console.error('1. Set MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 in .env (dev already uses public DNS for mongodb+srv)');
          console.error('2. Change Windows DNS to 8.8.8.8 / 1.1.1.1, then run: ipconfig /flushdns');
          console.error('3. In Atlas, use the standard (non-SRV) connection string instead of mongodb+srv://');
          console.error('4. Check MongoDB Atlas → Network Access allows your current IP');
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
