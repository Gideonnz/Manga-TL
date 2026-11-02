import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(request.url)
    const seriesId = searchParams.get('seriesId')
    
    const where = seriesId ? { seriesId } : {}
    const chapters = await prisma.chapter.findMany({
      where,
      include: {
        series: { select: { title: true, slug: true } },
        _count: { select: { pages: true } },
      },
      orderBy: [{ seriesId: 'asc' }, { number: 'asc' }],
    })
    return NextResponse.json(chapters)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get chapters error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const { seriesId, number, title, volume, language, targetLangs } = await request.json()
    
    if (!seriesId || number === undefined) {
      return NextResponse.json({ error: 'seriesId and number required' }, { status: 400 })
    }

    const chapter = await prisma.chapter.create({
      data: {
        seriesId,
        number,
        title,
        volume,
        language: language || 'ja',
        targetLangs: targetLangs || ['id'],
      },
    })
    return NextResponse.json(chapter, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create chapter error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
