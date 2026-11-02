import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bubbleId: string }> }
) {
  try {
    await requireAuth()
    const { bubbleId } = await params
    const { language, text, isAuto } = await request.json()

    if (!language || !text) {
      return NextResponse.json({ error: 'Language and text required' }, { status: 400 })
    }

    const translation = await prisma.translation.upsert({
      where: {
        bubbleId_language: { bubbleId, language },
      },
      update: { text, isAuto: isAuto || false },
      create: { bubbleId, language, text, isAuto: isAuto || false },
    })

    return NextResponse.json(translation)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Save translation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
