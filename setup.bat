@echo off
echo =================================
echo      AgroAI Setup Script
echo =================================
echo.

echo This script will help you set up AgroAI with all the new features:
echo - HackClub AI integration for crop analysis
echo - AI Chat assistant
echo - Email notifications
echo - MySQL database storage
echo.

echo STEP 1: Database Setup
echo ----------------------
echo Please make sure you have MySQL installed and running.
echo.
echo === For Windows ===
echo 1. Download MySQL from: https://dev.mysql.com/downloads/installer/
echo 2. Run the installer and follow setup wizard
echo 3. Start MySQL service: net start mysql80
echo.
echo === For Arch Linux ===
echo 1. Install MySQL: sudo pacman -S mysql
echo 2. Initialize database: sudo mysqld --initialize --user=mysql --basedir=/usr --datadir=/var/lib/mysql
echo 3. Start MySQL service: sudo systemctl start mysqld
echo 4. Enable auto-start: sudo systemctl enable mysqld
echo 5. Secure installation: sudo mysql_secure_installation
echo.
echo === Database Creation ===
echo 1. Login to MySQL: mysql -u root -p
echo 2. Create database: CREATE DATABASE agroai_db;
echo 3. Exit MySQL: EXIT;
echo 4. Import schema: mysql -u root -p agroai_db < database_schema.sql
echo 5. Update .env file with your database credentials
echo.

echo STEP 2: Email Configuration
echo ---------------------------
echo To enable email notifications:
echo 1. Get a Gmail App Password (if using Gmail)
echo 2. Update EMAIL_USER and EMAIL_PASS in .env file
echo.

echo STEP 3: HackClub AI
echo -------------------
echo HackClub AI is FREE and requires NO API key!
echo Just make sure you're a teen in Hack Club Slack.
echo The integration is already configured.
echo.

echo STEP 4: Start the application
echo ----------------------------
echo Run: npm start
echo Then visit: http://localhost:6996
echo.

echo =================================
echo     Setup Instructions Complete
echo =================================
echo.
echo Need help? Check the README.md file or contact support.
echo.

pause