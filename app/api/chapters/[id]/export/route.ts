import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getPublicUrl } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        series: true,
        pages: {
          orderBy: { number: 'asc' },
          include: {
            bubbles: {
              orderBy: { order: 'asc' },
              include: { translations: true },
            },
          },
        },
      },
    })

    if (!chapter) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const exportData = {
      series: { title: chapter.series.title, slug: chapter.series.slug },
      chapter: {
        number: chapter.number,
        title: chapter.title,
        volume: chapter.volume,
        language: chapter.language,
        targetLangs: chapter.targetLangs,
      },
      pages: chapter.pages.map(page => ({
        number: page.number,
        imageUrl: getPublicUrl(page.imageKey),
        width: page.width,
        height: page.height,
        bubbles: page.bubbles.map(bubble => ({
          id: bubble.id,
          x: bubble.x,
          y: bubble.y,
          width: bubble.width,
          height: bubble.height,
          originalText: bubble.originalText,
          order: bubble.order,
          translations: bubble.translations.reduce((acc, t) => {
            acc[t.language] = { text: t.text, isAuto: t.isAuto }
            return acc
          }, {} as Record<string, { text: string; isAuto: boolean }>),
        })),
      })),
    }

    if (format === 'json') {
      return NextResponse.json(exportData, {
        headers: {
          'Content-Disposition': `attachment; filename="${chapter.series.slug}-ch${chapter.number}.json"`,
        },
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
