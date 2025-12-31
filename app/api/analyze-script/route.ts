import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { script } = await request.json()

    if (!script || typeof script !== 'string') {
      return NextResponse.json(
        { error: 'Script is required' },
        { status: 400 }
      )
    }

    // Simple scene extraction using pattern matching and line breaks
    const scenes: string[] = []

    // Split by common scene indicators
    const lines = script.split(/\n+/)

    let currentScene = ''

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (!trimmedLine) continue

      // Check if line starts with scene indicator
      const isSceneMarker = /^(scene\s*\d+|int\.|ext\.|fade\s+in|fade\s+out|\d+\.)/i.test(trimmedLine)

      if (isSceneMarker && currentScene) {
        // Save previous scene and start new one
        scenes.push(currentScene.trim())
        currentScene = trimmedLine
      } else if (isSceneMarker) {
        // Start first scene
        currentScene = trimmedLine
      } else {
        // Continue building current scene
        currentScene += ' ' + trimmedLine
      }
    }

    // Add last scene
    if (currentScene) {
      scenes.push(currentScene.trim())
    }

    // If no scene markers found, split by paragraphs
    if (scenes.length === 0) {
      const paragraphs = script.split(/\n\s*\n/)
      paragraphs.forEach((para, idx) => {
        const trimmed = para.trim()
        if (trimmed) {
          scenes.push(`Scene ${idx + 1}: ${trimmed}`)
        }
      })
    }

    // If still no scenes, treat entire script as one scene
    if (scenes.length === 0) {
      scenes.push(script.trim())
    }

    // Clean up scenes and create optimized prompts for image generation
    const optimizedScenes = scenes.map((scene, idx) => {
      // Remove scene numbers and markers from the beginning
      let cleaned = scene.replace(/^(scene\s*\d+|int\.|ext\.|fade\s+in|fade\s+out|\d+\.)\s*[:;-]?\s*/i, '')

      // Limit length and add artistic style
      const words = cleaned.split(/\s+/)
      if (words.length > 50) {
        cleaned = words.slice(0, 50).join(' ') + '...'
      }

      // Add visual style keywords for better animated look
      return `${cleaned}, animated style, cinematic lighting, vibrant colors, detailed, high quality, digital art`
    })

    return NextResponse.json({
      scenes: optimizedScenes,
      count: optimizedScenes.length
    })
  } catch (error) {
    console.error('Error analyzing script:', error)
    return NextResponse.json(
      { error: 'Failed to analyze script' },
      { status: 500 }
    )
  }
}
