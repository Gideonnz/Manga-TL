import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { slugify } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { number: 'asc' },
          include: { _count: { select: { pages: true } } },
        },
      },
    })
    if (!series) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(series)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get series error:', error)
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
    const { title, description, author, coverImage, status } = await request.json()
    
    const data: any = {}
    if (title) {
      data.title = title
      data.slug = slugify(title)
    }
    if (description !== undefined) data.description = description
    if (author !== undefined) data.author = author
    if (coverImage !== undefined) data.coverImage = coverImage
    if (status) data.status = status

    const series = await prisma.series.update({
      where: { id },
      data,
    })
    return NextResponse.json(series)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update series error:', error)
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
    
    // Delete associated files
    const series = await prisma.series.findUnique({
      where: { id },
      include: { chapters: { include: { pages: true } } },
    })
    
    if (series) {
      const { deleteChapterFiles } = await import('@/lib/storage')
      for (const chapter of series.chapters) {
        await deleteChapterFiles(series.slug, String(chapter.number))
      }
    }

    await prisma.series.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Delete series error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
