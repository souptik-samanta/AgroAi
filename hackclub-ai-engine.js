const fs = require('fs');
const axios = require('axios');

class HackClubCropAI {
  constructor() {
    this.baseURL = 'https://ai.hackclub.com/chat/completions';
    this.model = 'openai/gpt-oss-120b'; // Using the 120B model for best results
  }

  // Convert image to base64
  imageToBase64(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      throw new Error(`Failed to read image: ${error.message}`);
    }
  }

  // Get image MIME type
  getImageMimeType(imagePath) {
    const extension = imagePath.toLowerCase().split('.').pop();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[extension] || 'image/jpeg';
  }

  // Validate if image is appropriate for crop analysis
  async validateImage(imagePath, cropType) {
    try {
      const base64Image = this.imageToBase64(imagePath);
      const mimeType = this.getImageMimeType(imagePath);

      const prompt = `Analyze this image and determine if it's suitable for crop analysis. 
      Expected crop type: ${cropType}
      
      Please respond with ONLY a JSON object containing:
      {
        "isValid": true/false,
        "reason": "explanation of why it's valid or invalid",
        "detectedSubject": "what you see in the image",
        "isCropRelated": true/false,
        "confidence": 0.0-1.0
      }
      
      Image should be rejected if:
      - Not a plant/crop image
      - Too blurry or poor quality
      - Doesn't match expected crop type (if specified)
      - Contains inappropriate content
      - Is a drawing/cartoon rather than real photo
      
      Respond with valid JSON only, no other text.`;

      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = response.data.choices[0].message.content;
      // Clean up the response to extract JSON
      const cleanResult = result.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanResult);
    } catch (error) {
      console.error('Image validation failed:', error);
      return {
        isValid: false,
        reason: 'Failed to validate image',
        detectedSubject: 'Unknown',
        isCropRelated: false,
        confidence: 0.0
      };
    }
  }

  // Main analysis function
  async analyzeImage(imagePath, cropType) {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 Starting Hack Club GPT-4 analysis for ${cropType}`);
      
      // First validate the image
      const validation = await this.validateImage(imagePath, cropType);
      
      if (!validation.isValid) {
        return {
          confidence: 0.0,
          health: 'Invalid Image',
          disease: 'Image Validation Failed',
          diseaseConfidence: 0.0,
          recommendation: `Image rejected: ${validation.reason}. Please upload a clear photo of your ${cropType} crop.`,
          analysisDate: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          validation: validation,
          error: true
        };
      }

      // If valid, proceed with detailed analysis
      const base64Image = this.imageToBase64(imagePath);
      const mimeType = this.getImageMimeType(imagePath);

      const analysisPrompt = `You are an expert agricultural AI analyzing a ${cropType} crop image. 
      Provide a detailed analysis in ONLY JSON format with no additional text:

      {
        "health": "Excellent/Good/Fair/Poor/Critical",
        "healthScore": 0-100,
        "disease": "specific disease name or 'Healthy'",
        "diseaseConfidence": 0.0-1.0,
        "symptoms": ["list", "of", "visible", "symptoms"],
        "recommendation": "detailed actionable advice",
        "urgency": "Low/Medium/High/Critical",
        "treatmentPlan": "specific treatment steps",
        "preventiveMeasures": ["prevention", "tips"],
        "expectedRecoveryTime": "time estimate if treatment applied",
        "analysis": {
          "leafColor": "description",
          "leafTexture": "description", 
          "growthPattern": "description",
          "visiblePests": "yes/no and type",
          "soilCondition": "assessment from visible roots/base",
          "overallVitality": "assessment"
        }
      }

      Consider factors like:
      - Leaf color, spots, wilting, yellowing
      - Plant structure and growth patterns
      - Visible pests or diseases
      - Soil condition around plant base
      - Overall plant vitality
      
      Be specific to ${cropType} crops and their common issues.
      Respond with valid JSON only, no other text or formatting.`;

      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.2
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const analysisResult = response.data.choices[0].message.content;
      // Clean up the response to extract JSON
      const cleanResult = analysisResult.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(cleanResult);

      // Format response to match expected structure
      const processingTime = Date.now() - startTime;
      
      return {
        confidence: analysis.diseaseConfidence || 0.85,
        health: analysis.health,
        disease: analysis.disease,
        diseaseConfidence: analysis.diseaseConfidence,
        recommendation: analysis.recommendation,
        analysisDate: new Date().toISOString(),
        processingTime: processingTime,
        validation: validation,
        detailedAnalysis: analysis,
        hackClubPowered: true,
        model: this.model
      };

    } catch (error) {
      console.error('Hack Club AI analysis failed:', error);
      
      // Return error response
      return {
        confidence: 0.0,
        health: 'Analysis Failed',
        disease: 'System Error',
        diseaseConfidence: 0.0,
        recommendation: 'Unable to analyze image. Please try again or check your internet connection.',
        analysisDate: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        error: true,
        errorMessage: error.message
      };
    }
  }

  // Get AI tips for crop type
  async getCropTips(cropType) {
    try {
      const prompt = `Provide 5 expert agricultural tips for growing healthy ${cropType} crops. 
      Return ONLY a JSON array with no additional text: ["tip1", "tip2", "tip3", "tip4", "tip5"]
      Focus on practical, actionable advice for farmers.
      
      Respond with valid JSON array only, no other formatting.`;

      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.3
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = response.data.choices[0].message.content;
      const cleanResult = result.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanResult);
    } catch (error) {
      console.error('Failed to get crop tips:', error);
      return [
        `Monitor your ${cropType} regularly for signs of disease`,
        `Ensure proper watering schedule for ${cropType}`,
        `Apply appropriate fertilizer for ${cropType} growth stage`,
        `Check soil pH levels regularly`,
        `Implement integrated pest management strategies`
      ];
    }
  }

  // Get available models from Hack Club
  async getAvailableModels() {
    try {
      const response = await axios.get('https://ai.hackclub.com/model');
      return response.data.split(',');
    } catch (error) {
      console.error('Failed to get models:', error);
      return ['openai/gpt-oss-120b', 'qwen/qwen3-32b'];
    }
  }
}

module.exports = HackClubCropAI;