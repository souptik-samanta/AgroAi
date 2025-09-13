# MySQL Installation Guide for Arch Linux

## Quick Setup Commands

```bash
# 1. Update system
sudo pacman -Syu

# 2. Install MySQL
sudo pacman -S mysql

# 3. Initialize MySQL data directory
sudo mysqld --initialize --user=mysql --basedir=/usr --datadir=/var/lib/mysql

# 4. Start MySQL service
sudo systemctl start mysqld

# 5. Enable MySQL to start on boot
sudo systemctl enable mysqld

# 6. Find the temporary root password
sudo grep 'temporary password' /var/log/mysqld.log

# 7. Secure MySQL installation
sudo mysql_secure_installation
```

## Step-by-Step Setup for AgroAI

### 1. Install MySQL
```bash
# Update package database
sudo pacman -Syu

# Install MySQL server
sudo pacman -S mysql
```

### 2. Initialize MySQL
```bash
# Initialize the MySQL data directory
sudo mysqld --initialize --user=mysql --basedir=/usr --datadir=/var/lib/mysql

# Note: This creates a temporary root password, check the logs for it
sudo grep 'temporary password' /var/log/mysqld.log
```

### 3. Start MySQL Service
```bash
# Start MySQL service
sudo systemctl start mysqld

# Enable MySQL to start automatically on boot
sudo systemctl enable mysqld

# Check if MySQL is running
sudo systemctl status mysqld
```

### 4. Secure MySQL Installation
```bash
# Run the security script
sudo mysql_secure_installation

# Follow the prompts:
# - Enter the temporary root password
# - Set a new root password
# - Remove anonymous users: Y
# - Disallow root login remotely: Y
# - Remove test database: Y
# - Reload privilege tables: Y
```

### 5. Create AgroAI Database and User
```bash
# Login to MySQL
sudo mysql -u root -p

# Create database
CREATE DATABASE agroai_db;

# Create a dedicated user for AgroAI
CREATE USER 'agroai'@'localhost' IDENTIFIED BY 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON agroai_db.* TO 'agroai'@'localhost';

# Apply changes
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### 6. Test Connection
```bash
# Test the new user connection
mysql -u agroai -p agroai_db

# If successful, you'll see the MySQL prompt
# Exit with: EXIT;
```

### 7. Import AgroAI Schema
```bash
# Navigate to your AgroAI project directory
cd /path/to/your/agroai/project

# Import the database schema
mysql -u agroai -p agroai_db < database_schema.sql

# Verify tables were created
mysql -u agroai -p agroai_db -e "SHOW TABLES;"
```

### 8. Update Environment Configuration
```bash
# Edit the .env file
nano .env

# Update these values:
DB_HOST=localhost
DB_USER=agroai
DB_PASSWORD=your_secure_password
DB_NAME=agroai_db
```

## Troubleshooting

### MySQL Service Issues
```bash
# Check MySQL status
sudo systemctl status mysqld

# View MySQL logs
sudo journalctl -u mysqld -f

# Restart MySQL if needed
sudo systemctl restart mysqld
```

### Connection Issues
```bash
# Test MySQL connection
mysql -u root -p

# Check if MySQL is listening on port 3306
sudo netstat -tlnp | grep :3306

# Check MySQL configuration
sudo cat /etc/mysql/my.cnf
```

### Permission Issues
```bash
# Fix MySQL data directory ownership
sudo chown -R mysql:mysql /var/lib/mysql

# Fix socket permissions
sudo chmod 755 /var/run/mysqld
```

### Forgot Root Password
```bash
# Stop MySQL
sudo systemctl stop mysqld

# Start MySQL in safe mode
sudo mysqld_safe --skip-grant-tables &

# Login without password
mysql -u root

# Reset password
USE mysql;
UPDATE user SET authentication_string=PASSWORD('new_password') WHERE User='root';
FLUSH PRIVILEGES;
EXIT;

# Kill safe mode process
sudo pkill mysqld_safe

# Start MySQL normally
sudo systemctl start mysqld
```

## Alternative: Using MariaDB (MySQL-compatible)

If you prefer MariaDB (which is also MySQL-compatible):

```bash
# Install MariaDB instead
sudo pacman -S mariadb

# Initialize MariaDB
sudo mysql_install_db --user=mysql --basedir=/usr --datadir=/var/lib/mysql

# Start MariaDB
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Secure installation
sudo mysql_secure_installation

# The rest of the setup is identical
```

## Performance Tuning (Optional)

For better performance, you can optimize MySQL:

```bash
# Edit MySQL configuration
sudo nano /etc/mysql/my.cnf

# Add these optimizations:
[mysqld]
innodb_buffer_pool_size = 128M
innodb_log_file_size = 32M
max_connections = 50
query_cache_type = 1
query_cache_size = 32M
```

Your AgroAI application is now ready to use MySQL on Arch Linux! 🎉