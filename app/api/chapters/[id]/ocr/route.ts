import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { triggerOCR, saveOCRResults } from '@/lib/ocr'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const { pageIds } = await request.json()

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { pages: true },
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    // Update chapter status
    await prisma.chapter.update({
      where: { id },
      data: { status: 'OCR_PROCESSING' },
    })

    const targetPageIds = pageIds || chapter.pages.map(p => p.id)
    const results = []

    for (const pageId of targetPageIds) {
      try {
        const ocrResult = await triggerOCR(pageId)
        if (ocrResult) {
          await saveOCRResults(pageId, ocrResult)
          results.push({ pageId, success: true, bubbles: ocrResult.bubbles.length })
        } else {
          results.push({ pageId, success: false, error: 'OCR disabled or failed' })
        }
      } catch (e) {
        results.push({ pageId, success: false, error: String(e) })
      }
    }

    await prisma.chapter.update({
      where: { id },
      data: { status: 'OCR_DONE' },
    })

    return NextResponse.json({ results })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('OCR error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
