# AgroAI with Gemini Vision API

## Setup Instructions

### 1. Get Your Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure the API Key

**Option A: Environment Variable (Recommended)**
```bash
# On Windows (PowerShell)
$env:GEMINI_API_KEY="your_api_key_here"

# On Windows (CMD)
set GEMINI_API_KEY=your_api_key_here

# On Mac/Linux
export GEMINI_API_KEY="your_api_key_here"
```

**Option B: Edit server.js directly**
1. Open `server.js`
2. Find line with `YOUR_GEMINI_API_KEY_HERE`
3. Replace it with your actual API key

### 3. Start the Server
```bash
node server.js
```

## Features

✅ **Real AI Image Analysis**: Uses Gemini Vision API for actual crop analysis
✅ **Image Validation**: Automatically detects if uploaded images are suitable for crop analysis
✅ **Disease Detection**: AI-powered disease identification with confidence scores
✅ **Smart Recommendations**: Personalized treatment and care suggestions
✅ **Error Handling**: Graceful handling of invalid images or API failures

## What the AI Does

1. **Validates Images**: Checks if the uploaded image is actually a crop/plant
2. **Analyzes Health**: Examines leaf color, texture, growth patterns
3. **Detects Diseases**: Identifies specific diseases and pests
4. **Provides Recommendations**: Gives actionable treatment advice
5. **Rejects Invalid Images**: Won't analyze non-crop images, drawings, or poor quality photos

## Image Requirements

- **Format**: JPG, PNG, GIF, WebP
- **Size**: Up to 10MB
- **Content**: Must be actual photographs of crops/plants
- **Quality**: Clear, well-lit images work best

## API Usage

The system will automatically:
- Analyze uploaded crop images
- Provide detailed health assessments
- Suggest specific treatments
- Reject inappropriate images with explanations