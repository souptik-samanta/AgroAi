#!/bin/bash

# AgroAI Setup Script for Linux (Arch/Ubuntu/Debian)
echo "================================="
echo "     AgroAI Setup Script (Linux)"
echo "================================="
echo

echo "This script will help you set up AgroAI with all the new features:"
echo "- HackClub AI integration for crop analysis"
echo "- AI Chat assistant" 
echo "- Email notifications"
echo "- MySQL database storage"
echo

# Detect OS
if [ -f /etc/arch-release ]; then
    OS="arch"
    echo "🐧 Detected: Arch Linux"
elif [ -f /etc/debian_version ]; then
    OS="debian"
    echo "🐧 Detected: Debian/Ubuntu"
else
    OS="unknown"
    echo "🐧 Detected: Unknown Linux distribution"
fi

echo
echo "STEP 1: Install MySQL"
echo "====================="

if [ "$OS" = "arch" ]; then
    echo "Installing MySQL on Arch Linux..."
    echo
    echo "1. Update system:"
    echo "   sudo pacman -Syu"
    echo
    echo "2. Install MySQL:"
    echo "   sudo pacman -S mysql"
    echo
    echo "3. Initialize MySQL database:"
    echo "   sudo mysqld --initialize --user=mysql --basedir=/usr --datadir=/var/lib/mysql"
    echo
    echo "4. Start MySQL service:"
    echo "   sudo systemctl start mysqld"
    echo
    echo "5. Enable MySQL to start on boot:"
    echo "   sudo systemctl enable mysqld"
    echo
    echo "6. Secure MySQL installation:"
    echo "   sudo mysql_secure_installation"
    echo

elif [ "$OS" = "debian" ]; then
    echo "Installing MySQL on Debian/Ubuntu..."
    echo
    echo "1. Update system:"
    echo "   sudo apt update && sudo apt upgrade -y"
    echo
    echo "2. Install MySQL:"
    echo "   sudo apt install mysql-server -y"
    echo
    echo "3. Start MySQL service:"
    echo "   sudo systemctl start mysql"
    echo
    echo "4. Enable MySQL to start on boot:"
    echo "   sudo systemctl enable mysql"
    echo
    echo "5. Secure MySQL installation:"
    echo "   sudo mysql_secure_installation"
    echo

else
    echo "Please install MySQL manually for your distribution:"
    echo "- Arch: sudo pacman -S mysql"
    echo "- Ubuntu/Debian: sudo apt install mysql-server"
    echo "- CentOS/RHEL: sudo yum install mysql-server"
    echo
fi

echo "STEP 2: Configure MySQL"
echo "======================"
echo
echo "1. Login to MySQL as root:"
echo "   sudo mysql -u root -p"
echo
echo "2. Create the AgroAI database:"
echo "   CREATE DATABASE agroai_db;"
echo
echo "3. Create a new user (recommended):"
echo "   CREATE USER 'agroai'@'localhost' IDENTIFIED BY 'your_password_here';"
echo "   GRANT ALL PRIVILEGES ON agroai_db.* TO 'agroai'@'localhost';"
echo "   FLUSH PRIVILEGES;"
echo
echo "4. Exit MySQL:"
echo "   EXIT;"
echo
echo "5. Test connection:"
echo "   mysql -u agroai -p agroai_db"
echo

echo "STEP 3: Import Database Schema"
echo "============================="
echo
echo "1. Import the schema file:"
echo "   mysql -u agroai -p agroai_db < database_schema.sql"
echo
echo "2. Verify tables were created:"
echo "   mysql -u agroai -p agroai_db -e 'SHOW TABLES;'"
echo

echo "STEP 4: Install Node.js Dependencies"
echo "===================================="
echo
echo "1. Make sure Node.js is installed:"
if [ "$OS" = "arch" ]; then
    echo "   sudo pacman -S nodejs npm"
elif [ "$OS" = "debian" ]; then
    echo "   sudo apt install nodejs npm"
else
    echo "   Install Node.js from: https://nodejs.org/"
fi
echo
echo "2. Install project dependencies:"
echo "   npm install"
echo

echo "STEP 5: Configure Environment"
echo "============================"
echo
echo "1. Copy and edit the .env file:"
echo "   cp .env .env.local"
echo "   nano .env"
echo
echo "2. Update these values:"
echo "   DB_HOST=localhost"
echo "   DB_USER=agroai"
echo "   DB_PASSWORD=your_password_here"
echo "   DB_NAME=agroai_db"
echo
echo "   EMAIL_USER=your_email@gmail.com"
echo "   EMAIL_PASS=your_gmail_app_password"
echo

echo "STEP 6: Email Setup (Optional)"
echo "============================="
echo
echo "For Gmail:"
echo "1. Enable 2-Factor Authentication on your Google account"
echo "2. Generate App Password:"
echo "   - Go to: https://myaccount.google.com/apppasswords"
echo "   - Select 'Mail' and 'Other (Custom name)'"
echo "   - Enter 'AgroAI' as the name"
echo "   - Use the generated 16-character password in .env"
echo

echo "STEP 7: HackClub AI Setup"
echo "========================"
echo
echo "🎉 HackClub AI is FREE and requires NO API key!"
echo "Requirements:"
echo "- Be a teen (13-18 years old)"
echo "- Join Hack Club Slack: https://hackclub.com/slack/"
echo "- The integration is already configured in the app"
echo

echo "STEP 8: Start AgroAI"
echo "=================="
echo
echo "1. Start the application:"
echo "   npm start"
echo
echo "2. Open your browser and visit:"
echo "   http://localhost:6996"
echo

echo "================================="
echo "    Setup Instructions Complete"
echo "================================="
echo
echo "🔧 Troubleshooting Tips:"
echo "- Check MySQL status: sudo systemctl status mysqld"
echo "- View MySQL logs: sudo journalctl -u mysqld"
echo "- Test database connection: mysql -u agroai -p agroai_db"
echo "- Check Node.js version: node --version (should be 18+)"
echo
echo "📚 Need help?"
echo "- Check README.md for detailed documentation"
echo "- Visit: https://github.com/your-username/agroai"
echo "- Join Hack Club Slack for community support"
echo
echo "Happy Farming with AI! 🌱🤖"