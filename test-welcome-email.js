// Direct Email Service Test
require('dotenv').config();
const EmailService = require('./email-service');

async function testWelcomeEmail() {
  console.log('🧪 Testing EmailService directly...');
  
  const emailService = new EmailService();
  
  // Test sending welcome email
  const testEmail = 'silitechservices@gmail.com'; // Send to self for testing
  const testName = 'Test User';
  
  console.log(`📧 Sending welcome email to: ${testEmail}`);
  
  try {
    const result = await emailService.sendWelcomeEmail(testEmail, testName);
    console.log('✅ Email service test result:', result);
  } catch (error) {
    console.error('❌ Email service test failed:', error);
  }
}

testWelcomeEmail();