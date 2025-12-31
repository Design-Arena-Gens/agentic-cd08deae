# Script to Animated Scenes Generator

Transform your video script into stunning animated scene images using AI.

## Features

- 🎬 Automatically analyzes your script and extracts scenes
- 🎨 Generates high-quality animated images for each scene
- 🆓 Uses free image generation APIs (Pollinations.ai by default)
- 📥 Download individual scenes or all at once
- ⚡ Real-time progress tracking
- 🎯 Optimized prompts for animated, cinematic looks

## How It Works

1. **Paste your script** - Enter your video script with scene descriptions
2. **AI Analysis** - The app extracts individual scenes from your script
3. **Image Generation** - Each scene is converted into a visual prompt and sent to AI image generators
4. **Download** - Get your animated scene images individually or in bulk

## Image Generation

The app uses **Pollinations.ai** by default - a completely free AI image generation service requiring no API keys.

### Optional Fallback Services

If you want additional options, you can configure:

- **Replicate** (free tier): Get API key from [replicate.com](https://replicate.com)
- **HuggingFace** (free tier): Get API key from [huggingface.co](https://huggingface.co/settings/tokens)

Add these to `.env.local`:
```
REPLICATE_API_TOKEN=your_token_here
HUGGINGFACE_API_TOKEN=your_token_here
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Example Script Format

```
Scene 1: A peaceful morning in a futuristic city with flying cars and tall glass buildings.

Scene 2: A young inventor working in her high-tech laboratory surrounded by holographic displays.

Scene 3: An exciting chase through neon-lit streets at night.
```

The app automatically detects scene markers like "Scene 1:", "INT.", "EXT.", or numbered lines. If no markers are found, it splits by paragraphs.

## Deployment

### Deploy to Vercel

```bash
vercel deploy --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Pollinations.ai** - Free AI image generation
- **Replicate** (optional) - Alternative AI service
- **HuggingFace** (optional) - Alternative AI service

## License

MIT
