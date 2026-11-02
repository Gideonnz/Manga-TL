import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { saveUploadedFile } from '@/lib/storage'

export async function POST(
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
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    
    if (!files.length) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const existingPages = chapter.pages.length
    const results = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const buffer = Buffer.from(await file.arrayBuffer())
      const pageNumber = existingPages + i + 1
      
      const relativePath = await saveUploadedFile(
        buffer,
        file.name,
        chapter.series.slug,
        String(chapter.number)
      )

      const page = await prisma.page.create({
        data: {
          chapterId: id,
          number: pageNumber,
          imagePath: relativePath,
        },
      })
      results.push(page)
    }

    // Update chapter status
    await prisma.chapter.update({
      where: { id },
      data: { status: 'OCR_DONE' },
    })

    return NextResponse.json(results, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Upload pages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
