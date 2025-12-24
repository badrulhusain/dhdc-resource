import mongoose from 'mongoose';
import 'dotenv/config';
import { User } from './server/models/User.ts';
import { hashPassword } from './server/lib/auth.ts';

async function run() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI missing');
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        let admin = await User.findOne({ email: 'testadmin@dhdc.com' });
        if (!admin) {
            const passwordHash = await hashPassword('admin123');
            admin = new User({
                name: 'Test Admin',
                email: 'testadmin@dhdc.com',
                passwordHash,
                role: 'admin'
            });
            await admin.save();
            console.log('Admin created: testadmin@dhdc.com / admin123');
        } else {
            console.log('Admin already exists: testadmin@dhdc.com');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
