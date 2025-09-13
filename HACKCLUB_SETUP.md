# AgroAI with Hack Club GPT-4 120B Vision API

## 🚀 FREE AI-Powered Crop Analysis!

Your crop analysis system now uses **Hack Club's FREE GPT-4 120B model** - no API keys needed!

## Features

✅ **FREE GPT-4 120B Vision API**: Unlimited usage through Hack Club  
✅ **No API Key Required**: Just start the server and go!  
✅ **Advanced Image Analysis**: Uses GPT-4's powerful vision capabilities  
✅ **Smart Image Validation**: Automatically detects inappropriate images  
✅ **Disease Detection**: AI-powered identification with confidence scores  
✅ **Treatment Recommendations**: Personalized advice for each crop  
✅ **Error Handling**: Graceful handling of network issues  

## Quick Start

```bash
# Just start the server - no setup needed!
node server.js
```

That's it! No API keys, no configuration, just pure AI power! 🎉

## How It Works

1. **Image Upload**: Upload any crop/plant image
2. **Validation**: GPT-4 checks if it's a valid crop image
3. **Analysis**: Detailed health assessment using vision AI
4. **Results**: Get disease detection, treatment plans, and recommendations
5. **Rejection**: Invalid images are rejected with explanations

## What GPT-4 120B Analyzes

- **Health Assessment**: Overall plant condition and vitality
- **Disease Detection**: Specific diseases with confidence scores  
- **Symptom Analysis**: Leaf color, texture, spots, wilting
- **Pest Identification**: Visible insects or pest damage
- **Treatment Plans**: Step-by-step recovery instructions
- **Prevention Tips**: How to avoid future issues
- **Recovery Timeline**: Expected healing time

## Image Requirements

- **Formats**: JPG, PNG, GIF, WebP
- **Size**: Up to 10MB  
- **Quality**: Clear, well-lit photographs work best
- **Content**: Must be real crop/plant photos (no drawings/cartoons)

## Available Models

The system uses `openai/gpt-oss-120b` by default, but Hack Club also provides:
- `qwen/qwen3-32b`
- `openai/gpt-oss-20b` 
- `meta-llama/llama-4-maverick`
- `moonshotai/kimi-k2-instruct`

## Example Analysis Response

```json
{
  "health": "Fair",
  "disease": "Early Leaf Blight", 
  "diseaseConfidence": 0.87,
  "recommendation": "Apply copper fungicide spray...",
  "treatmentPlan": "1. Remove affected leaves 2. Apply treatment...",
  "expectedRecoveryTime": "2-3 weeks with proper treatment",
  "hackClubPowered": true,
  "model": "openai/gpt-oss-120b"
}
```

## Why Hack Club?

- **100% Free**: No charges, no limits for teens in Hack Club
- **No API Keys**: Just works out of the box
- **Powerful Models**: Access to GPT-4 level models
- **Vision Capable**: Can analyze images, not just text
- **Fast**: Quick response times
- **Reliable**: Backed by Hack Club's infrastructure

## Troubleshooting

If analysis fails:
1. Check internet connection
2. Ensure image is valid crop photo
3. Try a different image format
4. Restart the server

The system automatically falls back to helpful error messages if the AI service is unavailable.

---

**Powered by Hack Club's FREE AI API** 🚀  
No registration, no API keys, just pure AI magic!