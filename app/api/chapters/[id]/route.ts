import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { deleteChapterFiles } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        series: true,
        pages: {
          orderBy: { number: 'asc' },
          include: { bubbles: { include: { translations: true } } },
        },
      },
    })
    if (!chapter) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(chapter)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get chapter error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const { title, volume, status, targetLangs } = await request.json()
    
    const data: any = {}
    if (title !== undefined) data.title = title
    if (volume !== undefined) data.volume = volume
    if (status) data.status = status
    if (targetLangs) data.targetLangs = targetLangs

    const chapter = await prisma.chapter.update({
      where: { id },
      data,
    })
    return NextResponse.json(chapter)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update chapter error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { series: true, pages: true },
    })
    
    if (!chapter) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await deleteChapterFiles(chapter.series.slug, String(chapter.number))
    await prisma.chapter.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete chapter error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
