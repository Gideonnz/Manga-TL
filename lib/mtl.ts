import { prisma } from './prisma'

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b'
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000'
const MTL_ENABLED = process.env.MTL_ENABLED === 'true'

export interface TranslateOptions {
  sourceLang: string
  targetLang: string
  text: string
}

export async function translateText(options: TranslateOptions): Promise<string> {
  if (!MTL_ENABLED) {
    throw new Error('MTL disabled')
  }

  // Try Ollama first
  try {
    return await translateWithOllama(options)
  } catch (e) {
    console.warn('Ollama failed, trying LibreTranslate:', e)
  }

  // Fallback to LibreTranslate
  try {
    return await translateWithLibreTranslate(options)
  } catch (e) {
    console.error('All translation services failed:', e)
    throw e
  }
}

async function translateWithOllama(options: TranslateOptions): Promise<string> {
  const prompt = `Translate the following ${options.sourceLang} text to ${options.targetLang}. 
Only return the translation, no explanations.
Text: "${options.text}"`

  const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.3 },
    }),
  })

  if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`)
  
  const data = await response.json()
  return data.response?.trim() || options.text
}

async function translateWithLibreTranslate(options: TranslateOptions): Promise<string> {
  const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: options.text,
      source: options.sourceLang,
      target: options.targetLang,
      format: 'text',
    }),
  })

  if (!response.ok) throw new Error(`LibreTranslate error: ${response.statusText}`)
  
  const data = await response.json()
  return data.translatedText || options.text
}

export async function translateChapter(
  chapterId: string,
  targetLang: string,
  sourceLang = 'ja'
) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      pages: {
        include: {
          bubbles: {
            include: { translations: true },
          },
        },
      },
    },
  })

  if (!chapter) throw new Error('Chapter not found')

  for (const page of chapter.pages) {
    for (const bubble of page.bubbles) {
      // Skip if already has translation for this language
      const existing = bubble.translations.find(t => t.language === targetLang)
      if (existing && !existing.isAuto) continue

      const sourceText = bubble.originalText || ''
      if (!sourceText.trim()) continue

      try {
        const translated = await translateText({
          sourceLang,
          targetLang,
          text: sourceText,
        })

        await prisma.translation.upsert({
          where: {
            bubbleId_language: { bubbleId: bubble.id, language: targetLang },
          },
          update: { text: translated, isAuto: true },
          create: { bubbleId: bubble.id, language: targetLang, text: translated, isAuto: true },
        })
      } catch (e) {
        console.error(`Failed to translate bubble ${bubble.id}:`, e)
      }
    }
  }

  return { success: true }
}
