import { NextRequest, NextResponse } from 'next/server'

// Free image generation using Pollinations.ai
async function generateWithPollinations(prompt: string): Promise<string> {
  // Pollinations.ai provides free AI image generation
  // We can directly construct the URL and it will generate the image
  const encodedPrompt = encodeURIComponent(prompt)
  const seed = Math.floor(Math.random() * 1000000)

  // Using Pollinations API - completely free, no API key needed
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&seed=${seed}&nologo=true`

  return imageUrl
}

// Alternative: Generate using Replicate's free tier (if API key is provided)
async function generateWithReplicate(prompt: string): Promise<string> {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN

  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN not configured')
  }

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      input: {
        prompt: prompt,
        num_outputs: 1,
      },
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to start image generation')
  }

  const prediction = await response.json()

  // Poll for completion
  let imageUrl = null
  let attempts = 0
  const maxAttempts = 60

  while (!imageUrl && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000))

    const statusResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        },
      }
    )

    const status = await statusResponse.json()

    if (status.status === 'succeeded' && status.output && status.output.length > 0) {
      imageUrl = status.output[0]
    } else if (status.status === 'failed') {
      throw new Error('Image generation failed')
    }

    attempts++
  }

  if (!imageUrl) {
    throw new Error('Image generation timed out')
  }

  return imageUrl
}

// Alternative: HuggingFace Inference API (free tier available)
async function generateWithHuggingFace(prompt: string): Promise<string> {
  const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN

  if (!HF_API_TOKEN) {
    throw new Error('HUGGINGFACE_API_TOKEN not configured')
  }

  const response = await fetch(
    'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          num_inference_steps: 30,
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error('HuggingFace generation failed')
  }

  const blob = await response.blob()
  const buffer = await blob.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  return `data:image/png;base64,${base64}`
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, sceneNumber } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    let imageUrl: string

    // Try multiple free services in order of preference
    try {
      // Primary: Pollinations.ai (completely free, no API key needed)
      imageUrl = await generateWithPollinations(prompt)

      // Verify the URL is accessible
      const testResponse = await fetch(imageUrl, { method: 'HEAD' })
      if (!testResponse.ok) {
        throw new Error('Pollinations image not accessible')
      }
    } catch (pollinationsError) {
      console.error('Pollinations failed:', pollinationsError)

      // Fallback 1: Try Replicate if API key exists
      if (process.env.REPLICATE_API_TOKEN) {
        try {
          imageUrl = await generateWithReplicate(prompt)
        } catch (replicateError) {
          console.error('Replicate failed:', replicateError)

          // Fallback 2: Try HuggingFace if API key exists
          if (process.env.HUGGINGFACE_API_TOKEN) {
            imageUrl = await generateWithHuggingFace(prompt)
          } else {
            throw new Error('All image generation services failed')
          }
        }
      } else {
        throw new Error('Image generation failed and no fallback APIs configured')
      }
    }

    return NextResponse.json({
      imageUrl,
      sceneNumber,
      prompt
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate image',
        details: 'Please ensure at least one image generation service is properly configured'
      },
      { status: 500 }
    )
  }
}
