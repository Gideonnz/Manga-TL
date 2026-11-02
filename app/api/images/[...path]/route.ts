import { NextRequest, NextResponse } from 'next/server'
import { getFilePath } from '@/lib/storage'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params
    const relativePath = pathParts.join('/')
    
    const fullPath = await getFilePath(relativePath)
    
    // Security: ensure path is within upload directory
    const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './data/uploads')
    const resolvedPath = path.resolve(fullPath)
    
    if (!resolvedPath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const file = await fs.readFile(resolvedPath)
    
    const ext = path.extname(resolvedPath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    }
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Serve image error:', error)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
