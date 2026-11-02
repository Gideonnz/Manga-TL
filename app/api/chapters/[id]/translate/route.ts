import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { translateChapter } from '@/lib/mtl'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const { id } = await params
    const { targetLang, sourceLang } = await request.json()

    if (!targetLang) {
      return NextResponse.json({ error: 'targetLang required' }, { status: 400 })
    }

    const chapter = await prisma.chapter.findUnique({ where: { id } })
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    await prisma.chapter.update({
      where: { id },
      data: { status: 'TRANSLATING' },
    })

    const result = await translateChapter(id, targetLang, sourceLang || chapter.language)

    await prisma.chapter.update({
      where: { id },
      data: { status: 'TRANSLATED' },
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Translate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
