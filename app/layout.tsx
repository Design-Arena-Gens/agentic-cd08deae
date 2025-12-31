import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Script to Animated Scenes',
  description: 'Transform your video script into animated scene images',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
