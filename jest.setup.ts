import 'dotenv/config';
import dotenv from 'dotenv';

// Load .env.local for integration tests (MongoDB, NextAuth, etc.)
dotenv.config({ path: '.env.local' });

// Safety: do not send real emails during tests.
process.env.RESEND_API_KEY = '';

