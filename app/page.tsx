'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Scene {
  sceneNumber: number
  description: string
  imageUrl: string | null
  status: 'pending' | 'generating' | 'complete' | 'error'
  error?: string
}

export default function Home() {
  const [script, setScript] = useState('')
  const [scenes, setScenes] = useState<Scene[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!script.trim()) return

    setIsProcessing(true)
    setScenes([])
    setProgress('Analyzing script and extracting scenes...')

    try {
      // Step 1: Analyze script and extract scenes
      const analyzeResponse = await fetch('/api/analyze-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      })

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze script')
      }

      const { scenes: sceneDescriptions } = await analyzeResponse.json()

      // Initialize scenes array
      const initialScenes: Scene[] = sceneDescriptions.map((desc: string, idx: number) => ({
        sceneNumber: idx + 1,
        description: desc,
        imageUrl: null,
        status: 'pending' as const,
      }))

      setScenes(initialScenes)
      setProgress(`Found ${initialScenes.length} scenes. Generating images...`)

      // Step 2: Generate images for each scene
      for (let i = 0; i < initialScenes.length; i++) {
        setProgress(`Generating image ${i + 1} of ${initialScenes.length}...`)

        setScenes(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'generating' as const } : s
        ))

        try {
          const generateResponse = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: initialScenes[i].description,
              sceneNumber: i + 1
            }),
          })

          if (!generateResponse.ok) {
            throw new Error('Failed to generate image')
          }

          const { imageUrl } = await generateResponse.json()

          setScenes(prev => prev.map((s, idx) =>
            idx === i ? { ...s, imageUrl, status: 'complete' as const } : s
          ))
        } catch (error) {
          setScenes(prev => prev.map((s, idx) =>
            idx === i ? {
              ...s,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Unknown error'
            } : s
          ))
        }
      }

      setProgress('All scenes generated!')
      setIsProcessing(false)
    } catch (error) {
      setProgress(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsProcessing(false)
    }
  }

  const downloadImage = async (imageUrl: string, sceneNumber: number) => {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scene-${sceneNumber}.png`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const downloadAllImages = async () => {
    for (const scene of scenes) {
      if (scene.imageUrl && scene.status === 'complete') {
        await downloadImage(scene.imageUrl, scene.sceneNumber)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-3">
            Script to Animated Scenes
          </h1>
          <p className="text-gray-600 text-lg">
            Transform your video script into stunning animated scene images
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSubmit}>
            <label className="block mb-3 text-lg font-semibold text-gray-700">
              Enter Your Video Script
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Paste your video script here...

Example:
Scene 1: A peaceful morning in a futuristic city with flying cars and tall glass buildings.
Scene 2: A young inventor working in her high-tech laboratory surrounded by holographic displays.
Scene 3: An exciting chase through neon-lit streets at night..."
              className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-800 resize-none"
              disabled={isProcessing}
            />
            <div className="mt-4 flex gap-4">
              <button
                type="submit"
                disabled={isProcessing || !script.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? 'Processing...' : 'Generate Scenes'}
              </button>
              {scenes.length > 0 && scenes.some(s => s.status === 'complete') && (
                <button
                  type="button"
                  onClick={downloadAllImages}
                  className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-all"
                >
                  Download All
                </button>
              )}
            </div>
          </form>

          {progress && (
            <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded">
              {progress}
            </div>
          )}
        </div>

        {scenes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scenes.map((scene) => (
              <div
                key={scene.sceneNumber}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  <h3 className="text-xl font-bold">Scene {scene.sceneNumber}</h3>
                </div>
                <div className="p-4">
                  <p className="text-gray-700 mb-4 text-sm">{scene.description}</p>

                  {scene.status === 'pending' && (
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">Waiting...</span>
                    </div>
                  )}

                  {scene.status === 'generating' && (
                    <div className="h-64 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                        <span className="text-purple-600 font-semibold">Generating...</span>
                      </div>
                    </div>
                  )}

                  {scene.status === 'complete' && scene.imageUrl && (
                    <div>
                      <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden mb-3">
                        <Image
                          src={scene.imageUrl}
                          alt={`Scene ${scene.sceneNumber}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        onClick={() => downloadImage(scene.imageUrl!, scene.sceneNumber)}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-all"
                      >
                        Download Image
                      </button>
                    </div>
                  )}

                  {scene.status === 'error' && (
                    <div className="h-64 bg-red-50 rounded-lg flex items-center justify-center">
                      <div className="text-center p-4">
                        <span className="text-red-600">Error: {scene.error}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
