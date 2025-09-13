const nodemailer = require('nodemailer');
const cron = require('node-cron');
const HackClubCropAI = require('./hackclub-ai-engine');

class EmailService {
  constructor() {
    // Configure email transporter (using Gmail as example)
    // You can also use other services like SendGrid, Mailgun, etc.
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || '', // Set this in environment
        pass: process.env.EMAIL_PASS || ''     // Use app password, not regular password
      }
    });
    
    this.cropAI = new HackClubCropAI();
    this.setupDailySchedule();
  }

  // Send welcome email on registration
  async sendWelcomeEmail(userEmail, userName) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .feature { background: white; margin: 15px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; }
        .cta { background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌱 Welcome to AgroAI!</h1>
          <p>Your AI-Powered Crop Analysis Platform</p>
        </div>
        <div class="content">
          <h2>Hello ${userName}! 👋</h2>
          <p>Welcome to the future of farming! Your AgroAI account is now active and ready to help you grow healthier crops.</p>
          
          <div class="feature">
            <h3>🤖 AI-Powered Analysis</h3>
            <p>Upload crop photos and get instant AI analysis using GPT-4 vision capabilities - completely free!</p>
          </div>
          
          <div class="feature">
            <h3>📊 Smart Recommendations</h3>
            <p>Receive personalized treatment plans, disease detection, and care instructions for your crops.</p>
          </div>
          
          <div class="feature">
            <h3>📧 Daily Summaries</h3>
            <p>Get daily email summaries with AI-generated care tips and reminders for your registered crops.</p>
          </div>
          
          <a href="http://localhost:3000/dashboard.html" class="cta">Start Analyzing Your Crops</a>
          
          <h3>Getting Started:</h3>
          <ol>
            <li>Login to your dashboard</li>
            <li>Upload your first crop image</li>
            <li>Get instant AI analysis and recommendations</li>
            <li>Track your crop health over time</li>
          </ol>
          
          <p><strong>Need Help?</strong> Our AI is available 24/7 to analyze your crops and provide expert advice.</p>
          
          <p>Happy Farming! 🚜</p>
          <p><em>The AgroAI Team</em></p>
        </div>
      </div>
    </body>
    </html>`;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'agroai@example.com',
      to: userEmail,
      subject: '🌱 Welcome to AgroAI - Your AI Farming Assistant!',
      html: htmlContent
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${userEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return false;
    }
  }

  // Generate daily summary for a user
  async generateDailySummary(user, userCrops, userAnalyses) {
    try {
      // Get AI-generated daily tips based on user's crops
      const cropTypes = [...new Set(userCrops.map(crop => crop.type))];
      const aiTips = [];
      
      for (const cropType of cropTypes) {
        const tips = await this.cropAI.getCropTips(cropType);
        aiTips.push({ cropType, tips: tips.slice(0, 3) }); // Get top 3 tips per crop
      }

      // Analyze recent health trends
      const recentAnalyses = userAnalyses
        .filter(a => new Date(a.analysisDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .sort((a, b) => new Date(b.analysisDate) - new Date(a.analysisDate));

      const healthTrend = this.calculateHealthTrend(recentAnalyses);
      
      return {
        userName: user.name,
        email: user.email,
        totalCrops: userCrops.length,
        healthyCrops: userCrops.filter(c => c.health === 'Excellent' || c.health === 'Good').length,
        recentAnalyses: recentAnalyses.slice(0, 3),
        aiTips,
        healthTrend,
        actionItems: this.generateActionItems(userCrops, recentAnalyses)
      };
    } catch (error) {
      console.error('Failed to generate daily summary:', error);
      return null;
    }
  }

  // Calculate health trend from recent analyses
  calculateHealthTrend(analyses) {
    if (analyses.length < 2) return 'stable';
    
    const healthValues = {
      'Excellent': 5,
      'Good': 4,
      'Fair': 3,
      'Poor': 2,
      'Critical': 1
    };
    
    const recent = analyses.slice(0, 3).map(a => healthValues[a.health] || 3);
    const older = analyses.slice(3, 6).map(a => healthValues[a.health] || 3);
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, val) => sum + val, 0) / older.length : recentAvg;
    
    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  }

  // Generate actionable items for the user
  generateActionItems(crops, analyses) {
    const actions = [];
    
    // Check for crops needing attention
    const criticalCrops = crops.filter(c => c.health === 'Critical' || c.health === 'Poor');
    if (criticalCrops.length > 0) {
      actions.push(`🚨 ${criticalCrops.length} crop(s) need immediate attention`);
    }
    
    // Check for overdue analyses
    const overdueAnalyses = crops.filter(c => {
      const lastAnalysis = analyses.find(a => a.cropId === c.id);
      if (!lastAnalysis) return true;
      return new Date() - new Date(lastAnalysis.analysisDate) > 7 * 24 * 60 * 60 * 1000;
    });
    
    if (overdueAnalyses.length > 0) {
      actions.push(`📸 ${overdueAnalyses.length} crop(s) ready for new analysis`);
    }
    
    // Disease alerts
    const diseasedCrops = analyses.filter(a => 
      a.disease !== 'Healthy' && 
      new Date() - new Date(a.analysisDate) < 3 * 24 * 60 * 60 * 1000
    );
    
    if (diseasedCrops.length > 0) {
      actions.push(`🦠 Monitor ${diseasedCrops.length} crop(s) for disease recovery`);
    }
    
    return actions;
  }

  // Send daily summary email
  async sendDailySummary(summaryData) {
    const { userName, email, totalCrops, healthyCrops, recentAnalyses, aiTips, healthTrend, actionItems } = summaryData;
    
    const trendEmoji = {
      'improving': '📈 Improving',
      'declining': '📉 Needs Attention', 
      'stable': '📊 Stable'
    };

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .section { background: white; margin: 15px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; }
        .stats { display: flex; justify-content: space-between; text-align: center; }
        .stat { background: white; padding: 15px; border-radius: 8px; flex: 1; margin: 0 10px; }
        .action-item { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
        .ai-tip { background: #e8f5e8; padding: 10px; margin: 8px 0; border-radius: 5px; }
        .cta { background: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌱 Daily Crop Summary</h1>
          <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="content">
          <h2>Hello ${userName}! 👋</h2>
          
          <div class="stats">
            <div class="stat">
              <h3>${totalCrops}</h3>
              <p>Total Crops</p>
            </div>
            <div class="stat">
              <h3>${healthyCrops}</h3>
              <p>Healthy Crops</p>
            </div>
            <div class="stat">
              <h3>${trendEmoji[healthTrend] || '📊 Stable'}</h3>
              <p>Health Trend</p>
            </div>
          </div>

          ${actionItems.length > 0 ? `
          <div class="section">
            <h3>🎯 Action Items for Today:</h3>
            ${actionItems.map(item => `<div class="action-item">${item}</div>`).join('')}
          </div>` : ''}

          ${recentAnalyses.length > 0 ? `
          <div class="section">
            <h3>📊 Recent Analysis Summary:</h3>
            ${recentAnalyses.slice(0, 2).map(analysis => `
              <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                <strong>${analysis.cropType || 'Crop'}</strong> - ${analysis.health}
                <br><small>${analysis.disease !== 'Healthy' ? '🦠 ' + analysis.disease : '✅ Healthy'}</small>
              </div>
            `).join('')}
          </div>` : ''}

          <div class="section">
            <h3>🤖 AI Care Tips for Today:</h3>
            ${aiTips.map(tipGroup => `
              <div>
                <h4>${tipGroup.cropType}</h4>
                ${tipGroup.tips.map(tip => `<div class="ai-tip">💡 ${tip}</div>`).join('')}
              </div>
            `).join('')}
          </div>

          <a href="http://localhost:3000/dashboard.html" class="cta">View Full Dashboard</a>
          
          <p><small>This summary is generated daily by AI based on your crop data. 
          To stop receiving these emails, update your preferences in the dashboard.</small></p>
          
          <p>Happy Farming! 🚜</p>
        </div>
      </div>
    </body>
    </html>`;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'agroai@example.com',
      to: email,
      subject: `🌱 Daily Crop Summary - ${new Date().toLocaleDateString()}`,
      html: htmlContent
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Daily summary sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send daily summary to ${email}:`, error);
      return false;
    }
  }

  // Setup daily email schedule (runs at 8 AM every day)
  setupDailySchedule() {
    // Schedule daily emails at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
      console.log('📧 Starting daily email summary task...');
      await this.sendAllDailySummaries();
    }, {
      timezone: "UTC"
    });
    
    console.log('📧 Daily email scheduler initialized (8 AM UTC)');
  }

  // Send daily summaries to all users
  async sendAllDailySummaries() {
    try {
      const fs = require('fs');
      const db = JSON.parse(fs.readFileSync('data/database.json', 'utf8'));
      
      for (const user of db.users) {
        const userCrops = db.crops.filter(c => c.userId === user.id);
        const userAnalyses = db.analyses.filter(a => a.userId === user.id);
        
        if (userCrops.length > 0) {
          const summaryData = await this.generateDailySummary(user, userCrops, userAnalyses);
          if (summaryData) {
            await this.sendDailySummary(summaryData);
            // Add small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      console.log('✅ Daily summaries completed');
    } catch (error) {
      console.error('❌ Failed to send daily summaries:', error);
    }
  }

  // Test email function (for development)
  async sendTestEmail(email) {
    return await this.sendWelcomeEmail(email, 'Test User');
  }
}

module.exports = EmailService;