import { prisma } from './prisma'

const OCR_API_URL = process.env.OCR_API_URL || 'http://localhost:8001'
const OCR_ENABLED = process.env.OCR_ENABLED === 'true'

export interface OCRResult {
  bubbles: Array<{
    x: number
    y: number
    width: number
    height: number
    text: string
    confidence: number
  }>
}

export async function triggerOCR(pageId: string): Promise<OCRResult | null> {
  if (!OCR_ENABLED) {
    console.log('OCR disabled')
    return null
  }

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: { chapter: { include: { series: true } } },
  })

  if (!page) throw new Error('Page not found')

  const imagePath = await getFilePath(page.imagePath)
  
  try {
    const response = await fetch(`${OCR_API_URL}/ocr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_path: imagePath }),
    })

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.statusText}`)
    }

    const result: OCRResult = await response.json()
    return result
  } catch (error) {
    console.error('OCR error:', error)
    throw error
  }
}

export async function saveOCRResults(pageId: string, results: OCRResult) {
  // Delete existing bubbles for this page
  await prisma.bubble.deleteMany({ where: { pageId } })

  // Create new bubbles from OCR results
  const bubbles = results.bubbles.map((b, index) => ({
    pageId,
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    originalText: b.text,
    order: index,
  }))

  await prisma.bubble.createMany({ data: bubbles })

  // Update page status
  await prisma.page.update({
    where: { id: pageId },
    data: { /* status will be derived from chapter */ },
  })

  return bubbles
}

async function getFilePath(relativePath: string) {
  const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads'
  return path.join(UPLOAD_DIR, relativePath)
}

import path from 'path'
