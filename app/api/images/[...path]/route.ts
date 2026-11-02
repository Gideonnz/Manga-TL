import { NextRequest, NextResponse } from 'next/server'
import { getPublicUrl } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params
    const key = pathParts.join('/')
    
    const url = getPublicUrl(key)
    
    // Redirect to signed/public URL
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Serve image error:', error)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
