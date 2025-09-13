const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const { UserDB, EmailLogDB, CropDB, AnalysisDB } = require('./database');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    this.fromAddress = process.env.EMAIL_FROM || 'AgroAI <noreply@agroai.com>';
    this.setupWeeklyDigest();
  }

  async sendEmail(to, subject, htmlContent, userId, emailType = 'custom') {
    try {
      // Log email attempt
      const emailLog = await EmailLogDB.logEmail(userId, emailType, subject, 'pending');
      const emailLogId = emailLog.id;

      const mailOptions = {
        from: this.fromAddress,
        to: to,
        subject: subject,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      
      // Update log as sent
      await EmailLogDB.updateStatus(emailLogId, 'sent');
      console.log(`✅ Email sent successfully to ${to}: ${subject}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      // Try to update status if emailLogId exists
      try {
        if (emailLogId) await EmailLogDB.updateStatus(emailLogId, 'failed');
      } catch (logError) {
        console.error('Failed to update email log:', logError.message);
      }
      return false;
    }
  }

  async sendRegistrationEmail(user) {
    const subject = '🌱 Welcome to AgroAI - Your Smart Farming Journey Begins!';
    const htmlContent = this.getRegistrationEmailTemplate(user);
    
    return await this.sendEmail(user.email, subject, htmlContent, user.id, 'registration');
  }

  async sendWeeklyDigest(user) {
    try {
      // Get user's crops and recent analyses
      const crops = await CropDB.findByUserId(user.id);
      const analyses = await AnalysisDB.findByUserId(user.id);
      
      // Filter analyses from the last week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentAnalyses = analyses.filter(analysis => 
        new Date(analysis.analysis_date) > weekAgo
      );

      if (crops.length === 0) {
        return false; // No crops to report on
      }

      const subject = `🌾 Your Weekly AgroAI Crop Report - ${crops.length} Crops Monitored`;
      const htmlContent = this.getWeeklyDigestTemplate(user, crops, recentAnalyses);
      
      return await this.sendEmail(user.email, subject, htmlContent, user.id, 'weekly_digest');
      
    } catch (error) {
      console.error('Failed to send weekly digest:', error.message);
      return false;
    }
  }

  async sendAnalysisCompleteEmail(user, crop, analysis) {
    const subject = `📊 Analysis Complete: ${crop.name} Health Report`;
    const htmlContent = this.getAnalysisCompleteTemplate(user, crop, analysis);
    
    return await this.sendEmail(user.email, subject, htmlContent, user.id, 'analysis_complete');
  }

  getRegistrationEmailTemplate(user) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; }
            .features { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
            .feature { background: white; padding: 15px; border-radius: 8px; flex: 1; min-width: 250px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌱 Welcome to AgroAI!</h1>
                <p>Your Smart Farming Assistant</p>
            </div>
            
            <div class="content">
                <h2>Hello ${user.username}! 👋</h2>
                <p>Thank you for joining AgroAI! We're excited to help you optimize your crop health and farming productivity with AI-powered insights.</p>
                
                <h3>🚀 What you can do with AgroAI:</h3>
                <div class="features">
                    <div class="feature">
                        <h4>📸 Smart Photo Analysis</h4>
                        <p>Upload crop photos and get instant AI-powered health assessments with actionable recommendations.</p>
                    </div>
                    <div class="feature">
                        <h4>💬 AI Chat Assistant</h4>
                        <p>Ask questions about farming, crop care, pest management, and get expert advice 24/7.</p>
                    </div>
                    <div class="feature">
                        <h4>📊 Crop Monitoring</h4>
                        <p>Track your crops over time and receive weekly digest reports on their health status.</p>
                    </div>
                    <div class="feature">
                        <h4>📧 Smart Notifications</h4>
                        <p>Receive timely updates and personalized recommendations via email.</p>
                    </div>
                </div>
                
                <h3>🎯 Get Started:</h3>
                <ol>
                    <li><strong>Add your first crop:</strong> Go to the dashboard and create a crop profile</li>
                    <li><strong>Upload photos:</strong> Take photos of your crops for AI analysis</li>
                    <li><strong>Chat with AgroAI:</strong> Ask questions about farming and crop care</li>
                    <li><strong>Track progress:</strong> Monitor your crops' health over time</li>
                </ol>
                
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${process.env.APP_URL || 'http://localhost:6996'}/dashboard.html" class="cta-button">
                        🚀 Start Farming Smarter
                    </a>
                </div>
                
                <p><strong>Need help?</strong> Reply to this email or visit our support center. We're here to help you succeed!</p>
            </div>
            
            <div class="footer">
                <p>Happy Farming! 🌾<br>The AgroAI Team</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  getWeeklyDigestTemplate(user, crops, recentAnalyses) {
    const healthyCount = recentAnalyses.filter(a => ['Excellent', 'Good'].includes(a.health)).length;
    const unhealthyCount = recentAnalyses.length - healthyCount;
    
    const cropSummary = crops.map(crop => {
      const cropAnalyses = recentAnalyses.filter(a => a.crop_id === crop.id);
      const latestAnalysis = cropAnalyses[0];
      
      return `
        <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid ${latestAnalysis ? (latestAnalysis.health === 'Excellent' || latestAnalysis.health === 'Good' ? '#4CAF50' : '#ff9800') : '#ddd'};">
          <h4>${crop.name} (${crop.type})</h4>
          <p><strong>Location:</strong> ${crop.location}</p>
          ${latestAnalysis ? `
            <p><strong>Latest Health:</strong> ${latestAnalysis.health} (${latestAnalysis.confidence}% confidence)</p>
            <p><strong>Status:</strong> ${latestAnalysis.disease}</p>
            <p><strong>Recommendation:</strong> ${latestAnalysis.recommendation}</p>
          ` : '<p><em>No recent analysis available</em></p>'}
        </div>
      `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; }
            .stats { display: flex; gap: 15px; margin: 20px 0; }
            .stat { background: white; padding: 15px; border-radius: 8px; flex: 1; text-align: center; }
            .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌾 Weekly Crop Report</h1>
                <p>Your farming progress summary</p>
            </div>
            
            <div class="content">
                <h2>Hello ${user.username}! 👋</h2>
                <p>Here's your weekly AgroAI crop monitoring summary:</p>
                
                <div class="stats">
                    <div class="stat">
                        <h3>${crops.length}</h3>
                        <p>Total Crops</p>
                    </div>
                    <div class="stat">
                        <h3>${recentAnalyses.length}</h3>
                        <p>Recent Analyses</p>
                    </div>
                    <div class="stat">
                        <h3>${healthyCount}</h3>
                        <p>Healthy Crops</p>
                    </div>
                </div>
                
                <h3>🌱 Crop Status Updates:</h3>
                ${cropSummary}
                
                ${unhealthyCount > 0 ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h4>⚠️ Attention Needed</h4>
                    <p>${unhealthyCount} crop(s) may need attention. Review the recommendations above and consider taking action.</p>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${process.env.APP_URL || 'http://localhost:6996'}/dashboard.html" class="cta-button">
                        📊 View Full Dashboard
                    </a>
                </div>
                
                <p><small>This is your weekly digest. You can manage email preferences in your dashboard.</small></p>
            </div>
            
            <div class="footer">
                <p>Keep Growing! 🌱<br>The AgroAI Team</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  getAnalysisCompleteTemplate(user, crop, analysis) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; }
            .analysis-result { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${analysis.health === 'Excellent' || analysis.health === 'Good' ? '#4CAF50' : '#ff9800'}; }
            .cta-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Analysis Complete</h1>
                <p>AI Health Assessment Results</p>
            </div>
            
            <div class="content">
                <h2>Hello ${user.username}! 👋</h2>
                <p>Your AI analysis for <strong>${crop.name}</strong> is complete!</p>
                
                <div class="analysis-result">
                    <h3>🌱 ${crop.name} (${crop.type})</h3>
                    <p><strong>Location:</strong> ${crop.location}</p>
                    <p><strong>Health Status:</strong> ${analysis.health}</p>
                    <p><strong>Confidence:</strong> ${analysis.confidence}%</p>
                    <p><strong>Detected Issue:</strong> ${analysis.disease}</p>
                    <p><strong>Recommendation:</strong> ${analysis.recommendation}</p>
                    ${analysis.details ? `<p><strong>Details:</strong> ${analysis.details}</p>` : ''}
                </div>
                
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${process.env.APP_URL || 'http://localhost:6996'}/dashboard.html" class="cta-button">
                        📊 View Full Report
                    </a>
                </div>
                
                <p>Keep monitoring your crops for the best results! 📸</p>
            </div>
            
            <div class="footer">
                <p>Happy Farming! 🌾<br>The AgroAI Team</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  setupWeeklyDigest() {
    // Run every Sunday at 9 AM
    cron.schedule('0 9 * * 0', async () => {
      console.log('🕒 Running weekly digest job...');
      
      try {
        // Get all users who want weekly digest
        const users = await UserDB.findAll();
        
        for (const user of users) {
          // Check if user has weekly digest enabled (default: true)
          if (user.weekly_digest_enabled !== 0) {
            await this.sendWeeklyDigest(user);
            console.log(`📧 Weekly digest sent to ${user.email}`);
            // Add small delay to avoid overwhelming email service
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        console.log('✅ Weekly digest job completed');
      } catch (error) {
        console.error('❌ Weekly digest job failed:', error.message);
      }
    });
    
    console.log('📅 Weekly digest scheduled for Sundays at 9 AM');
  }

  // Manual trigger for weekly digest (for testing or immediate send)
  async triggerWeeklyDigest(userId = null) {
    try {
      if (userId) {
        const user = await UserDB.findById(userId);
        if (user) {
          return await this.sendWeeklyDigest(user);
        }
      } else {
        const users = await UserDB.findAll();
        let sent = 0;
        for (const user of users) {
          const success = await this.sendWeeklyDigest(user);
          if (success) sent++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return sent;
      }
    } catch (error) {
      console.error('Manual weekly digest failed:', error.message);
      return false;
    }
  }

  async updateEmailPreferences(userId, preferences) {
    try {
      await UserDB.updateEmailPreferences(userId, preferences);
      return true;
    } catch (error) {
      console.error('Failed to update email preferences:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();