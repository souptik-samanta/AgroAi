const bcrypt = require('bcryptjs');
const { UserDB, runQuery } = require('./database');

async function createAdminAccount() {
    try {
        // Check if admin already exists
        const existingAdmin = await UserDB.findByEmail('admin@s.com');
        if (existingAdmin) {
            console.log('🔧 Admin account admin@s.com already exists!');
            
            // Update password to admin123
            const passwordHash = await bcrypt.hash('admin123', 10);
            const sql = 'UPDATE users SET password_hash = ? WHERE email = ?';
            await runQuery(sql, [passwordHash, 'admin@s.com']);
            console.log('🔑 Password updated to admin123 for admin@s.com');
            return;
        }

        // Hash the password
        const passwordHash = await bcrypt.hash('admin123', 10);

        // Create admin user data
        const adminData = {
            email: 'admin@s.com',
            password_hash: passwordHash,
            full_name: 'System Administrator',
            phone: null,
            location: 'System',
            farm_size: null,
            crop_types: 'All'
        };

        // Create the admin user
        const adminUser = await UserDB.create(adminData);
        console.log('✅ Admin account created successfully!');
        console.log('📧 Email: admin@s.com');
        console.log('🔑 Password: admin123');
        console.log(`🆔 User ID: ${adminUser.id}`);

    } catch (error) {
        console.error('❌ Error creating admin account:', error);
    }

    process.exit(0);
}

// Run the function
createAdminAccount();