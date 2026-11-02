import { prisma } from './prisma'

const OCR_API_URL = process.env.OCR_API_URL
const OCR_API_KEY = process.env.OCR_API_KEY
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

  if (!OCR_API_URL) {
    throw new Error('OCR_API_URL not configured')
  }

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: { chapter: { include: { series: true } } },
  })

  if (!page) throw new Error('Page not found')

  const imageUrl = getPublicUrl(page.imagePath)
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (OCR_API_KEY) {
      headers['Authorization'] = `Bearer ${OCR_API_KEY}`
    }

    const response = await fetch(`${OCR_API_URL}/ocr`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ image_url: imageUrl }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OCR API error: ${response.status} - ${err}`)
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
  return bubbles
}

function getPublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL
  if (publicUrl) {
    return `${publicUrl}/${key}`
  }
  // This would need the storage function - simplified here
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/images/${key}`
}
