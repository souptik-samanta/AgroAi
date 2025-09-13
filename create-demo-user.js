const bcrypt = require('bcryptjs');
const { UserDB } = require('./database');

async function createDemoUser() {
    try {
        console.log('Creating demo user...');
        
        // Check if demo user exists
        const existing = await UserDB.findByEmail('demo@agroai.com');
        if (existing) {
            console.log('Demo user already exists');
            return;
        }
        
        const hashedPassword = await bcrypt.hash('demo123', 10);
        
        const demoUser = {
            email: 'demo@agroai.com',
            password_hash: hashedPassword,
            full_name: 'Demo User',
            phone: null,
            location: 'Demo Farm',
            farm_size: 10,
            crop_types: 'Tomatoes, Corn'
        };
        
        const createdUser = await UserDB.create(demoUser);
        console.log('✅ Demo user created successfully:', createdUser.id);
        console.log('📧 Email: demo@agroai.com');
        console.log('🔑 Password: demo123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating demo user:', error);
        process.exit(1);
    }
}

createDemoUser();