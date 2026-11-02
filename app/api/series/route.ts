import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { slugify } from '@/lib/utils'

export async function GET() {
  try {
    await requireAuth()
    const series = await prisma.series.findMany({
      include: {
        _count: { select: { chapters: true } },
        chapters: { take: 1, orderBy: { number: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(series)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get series error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const { title, description, author, coverImage } = await request.json()
    
    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 })
    }

    const baseSlug = slugify(title)
    let slug = baseSlug
    let counter = 1
    while (await prisma.series.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const series = await prisma.series.create({
      data: { title, slug, description, author, coverImage },
    })

    return NextResponse.json(series, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Create series error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
