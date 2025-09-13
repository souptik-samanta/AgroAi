# AgroAI - Advanced Smart Farming Platform

## 🌱 Overview

AgroAI is a comprehensive smart farming platform powered by advanced AI technology. It helps farmers optimize crop health, make data-driven decisions, and improve agricultural productivity through intelligent photo analysis, conversational AI assistance, and automated monitoring.

## 🚀 New Features

### 1. **HackClub AI Integration**
- **Free AI Service**: Powered by HackClub AI (free for teens in Hack Club)
- **Real-time Photo Analysis**: Instant crop health assessment from photos
- **Advanced Models**: Access to Qwen 3 32B, GPT-OSS, LLaMA 4, and more
- **Automatic Processing**: AI analysis triggers automatically when photos are uploaded

### 2. **AI Chat Assistant**
- **24/7 Expert Advice**: Get instant answers about farming, crop care, and agriculture
- **Conversation History**: Save and revisit past conversations
- **Context-Aware**: AI remembers your crops and previous discussions
- **Multi-topic Support**: Help with pests, diseases, irrigation, fertilization, weather planning

### 3. **Smart Email System**
- **Welcome Emails**: Beautifully designed registration confirmations
- **Weekly Digests**: Automated crop health summaries sent weekly
- **Analysis Alerts**: Instant notifications when AI analysis completes
- **Customizable Preferences**: Control which emails you receive
- **Manual Triggers**: Send weekly digest on-demand

### 4. **MySQL Database Storage**
- **Secure Data Storage**: All user data, photos, and analyses stored in MySQL
- **High Performance**: Optimized queries for fast data retrieval
- **Data Integrity**: Foreign key relationships and constraints
- **Scalability**: Designed to handle growing data volumes
- **Export Functionality**: Download your data anytime

### 5. **Enhanced User Experience**
- **Settings Dashboard**: Manage account, email preferences, and AI configuration
- **Data Statistics**: Track your crops, analyses, and chat history
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Updates**: Live status indicators and notifications

## 📋 Requirements

### System Requirements
- **Node.js** 18+ 
- **MySQL** 8.0+
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

### For HackClub AI
- Must be a teen in the [Hack Club Slack](https://hackclub.com/slack/)
- No API key required - completely free!

## 🛠️ Installation & Setup

### 1. Clone and Install
```bash
cd your-project-directory
npm install
```

### 2. Database Setup
```bash
# 1. Create MySQL database
mysql -u root -p
CREATE DATABASE agroai_db;
EXIT;

# 2. Import schema
mysql -u root -p agroai_db < database_schema.sql
```

### 3. Environment Configuration
Copy `.env` file and configure:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=agroai_db

# Email Configuration (Gmail recommended)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=AgroAI <your_email@gmail.com>

# HackClub AI (No API key needed!)
HACKCLUB_AI_URL=https://ai.hackclub.com/chat/completions
HACKCLUB_AI_MODEL=qwen/qwen3-32b

# Server Configuration
SESSION_SECRET=your-secret-key-here
PORT=6996
```

### 4. Email Setup (Optional but Recommended)
For Gmail:
1. Enable 2-Factor Authentication
2. Generate App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Use the app password in EMAIL_PASS

### 5. Start the Application
```bash
npm start
```

Visit: `http://localhost:6996`

## 🎯 Features Guide

### AI Photo Analysis
1. **Upload Photos**: Add crop photos when creating crops or later
2. **Automatic Analysis**: AI processes images immediately
3. **Detailed Reports**: Get health status, disease identification, and recommendations
4. **Email Notifications**: Receive analysis results via email

### AI Chat Assistant
1. **Start Conversations**: Click "AI Chat" in navigation
2. **Ask Questions**: Type any farming-related question
3. **Get Expert Advice**: Receive detailed, contextual responses
4. **Save History**: All conversations are automatically saved

### Email Management
1. **Settings Page**: Configure email preferences
2. **Weekly Digest**: Automatic crop summaries every Sunday
3. **Manual Send**: Trigger weekly digest anytime
4. **Custom Notifications**: Choose which emails to receive

### Data Management
1. **Secure Storage**: All data encrypted and stored in MySQL
2. **Export Options**: Download your data as JSON
3. **Statistics**: View usage statistics and data counts
4. **Privacy Controls**: Manage what data is stored

## 🔧 Configuration Options

### Available AI Models
- `qwen/qwen3-32b` (Default - Recommended)
- `openai/gpt-oss-120b`
- `openai/gpt-oss-20b`
- `meta-llama/llama-4-maverick`
- `moonshotai/kimi-k2-instruct-0905`

### Email Types
- **Registration**: Welcome emails for new users
- **Weekly Digest**: Automated crop summaries
- **Analysis Complete**: AI analysis notifications
- **Custom**: Manual notifications

### Database Tables
- `users`: User accounts and preferences
- `crops`: Crop information and images
- `analyses`: AI analysis results
- `chat_conversations`: Chat conversation history
- `chat_messages`: Individual chat messages
- `email_logs`: Email delivery tracking

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test MySQL connection
mysql -u root -p -h localhost

# Check if database exists
SHOW DATABASES;

# Verify tables
USE agroai_db;
SHOW TABLES;
```

### Email Delivery Issues
1. **Check Gmail Settings**: Ensure 2FA and App Passwords are enabled
2. **Firewall**: Make sure port 587 (SMTP) is not blocked
3. **Credentials**: Verify EMAIL_USER and EMAIL_PASS in .env

### HackClub AI Issues
1. **Slack Membership**: Ensure you're in Hack Club Slack
2. **Age Requirement**: Service is for teens only
3. **Rate Limits**: Don't spam requests to avoid being blocked
4. **Network**: Check internet connection

### Performance Issues
1. **Database Indexes**: Schema includes optimized indexes
2. **Image Size**: Limit uploads to 10MB per image
3. **Memory**: Ensure adequate RAM for Node.js and MySQL

## 📊 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout

### Crops & Analysis
- `GET /api/crops` - Get user's crops
- `POST /api/crops` - Create new crop
- `POST /api/crops/:id/upload-image` - Upload crop image
- `DELETE /api/crops/:id` - Delete crop
- `GET /api/analyses` - Get analysis results
- `POST /api/analyze/:cropId` - Request new analysis

### Chat System
- `GET /api/chat/conversations` - Get conversations
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message

### Settings & Preferences
- `GET /api/email-preferences` - Get email settings
- `POST /api/email-preferences` - Update email settings
- `POST /api/send-weekly-digest` - Send digest manually
- `GET /api/ai-models` - Get available AI models

## 🤝 Support

### Community
- **GitHub Issues**: Report bugs and request features
- **Hack Club Slack**: Get help from the community
- **Documentation**: This README and code comments

### Development
- **Node.js/Express**: Backend server
- **MySQL**: Database storage
- **Vanilla JS**: Frontend without heavy frameworks
- **HackClub AI**: Free AI service for teens

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎉 Acknowledgments

- **Hack Club**: For providing free AI services to teens
- **Node.js Community**: For excellent packages and tools
- **MySQL**: For reliable database technology
- **Contributors**: Everyone who helps improve AgroAI

---

**Happy Farming with AI! 🌾🤖**

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/your-username/agroai).