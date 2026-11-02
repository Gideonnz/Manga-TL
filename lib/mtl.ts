import { prisma } from './prisma'

// MTL Provider Types
type MTLProvider = 'deepl' | 'libretranslate' | 'google' | 'openai'

const MTL_PROVIDER = (process.env.MTL_PROVIDER as MTLProvider) || 'deepl'
const MTL_ENABLED = process.env.MTL_ENABLED === 'true'

export interface TranslateOptions {
  sourceLang: string
  targetLang: string
  text: string
}

function mapLangCode(lang: string, provider: MTLProvider): string {
  const maps: Record<MTLProvider, Record<string, string>> = {
    deepl: {
      ja: 'JA', en: 'EN', id: 'ID', zh: 'ZH', ko: 'KO', 
      es: 'ES', fr: 'FR', de: 'DE', pt: 'PT', ru: 'RU',
    },
    libretranslate: {
      ja: 'ja', en: 'en', id: 'id', zh: 'zh', ko: 'ko',
      es: 'es', fr: 'fr', de: 'de', pt: 'pt', ru: 'ru',
    },
    google: {
      ja: 'ja', en: 'en', id: 'id', zh: 'zh', ko: 'ko',
      es: 'es', fr: 'fr', de: 'de', pt: 'pt', ru: 'ru',
    },
    openai: {
      ja: 'Japanese', en: 'English', id: 'Indonesian', 
      zh: 'Chinese', ko: 'Korean', es: 'Spanish', 
      fr: 'French', de: 'German', pt: 'Portuguese', ru: 'Russian',
    },
  }
  return maps[provider]?.[lang] || lang
}

export async function translateText(options: TranslateOptions): Promise<string> {
  if (!MTL_ENABLED) {
    throw new Error('MTL disabled')
  }

  switch (MTL_PROVIDER) {
    case 'deepl':
      return translateDeepL(options)
    case 'libretranslate':
      return translateLibreTranslate(options)
    case 'google':
      return translateGoogle(options)
    case 'openai':
      return translateOpenAI(options)
    default:
      throw new Error(`Unknown MTL provider: ${MTL_PROVIDER}`)
  }
}

// DeepL API
async function translateDeepL(options: TranslateOptions): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY
  const apiUrl = process.env.DEEPL_API_URL || 'https://api-free.deepl.com'
  
  if (!apiKey) throw new Error('DEEPL_API_KEY not set')

  const params = new URLSearchParams()
  params.append('auth_key', apiKey)
  params.append('text', options.text)
  params.append('source_lang', mapLangCode(options.sourceLang, 'deepl'))
  params.append('target_lang', mapLangCode(options.targetLang, 'deepl'))

  const response = await fetch(`${apiUrl}/v2/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DeepL error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return data.translations?.[0]?.text || options.text
}

// LibreTranslate API
async function translateLibreTranslate(options: TranslateOptions): Promise<string> {
  const apiUrl = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.de'
  const apiKey = process.env.LIBRETRANSLATE_API_KEY

  const body: Record<string, string> = {
    q: options.text,
    source: mapLangCode(options.sourceLang, 'libretranslate'),
    target: mapLangCode(options.targetLang, 'libretranslate'),
    format: 'text',
  }

  if (apiKey) body.api_key = apiKey

  const response = await fetch(`${apiUrl}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`LibreTranslate error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return data.translatedText || options.text
}

// Google Translate API (v3)
async function translateGoogle(options: TranslateOptions): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!apiKey) throw new Error('GOOGLE_TRANSLATE_API_KEY not set')

  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: options.text,
        source: mapLangCode(options.sourceLang, 'google'),
        target: mapLangCode(options.targetLang, 'google'),
        format: 'text',
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Google Translate error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return data.data?.translations?.[0]?.translatedText || options.text
}

// OpenAI-compatible API (OpenRouter, Together, etc.)
async function translateOpenAI(options: TranslateOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  const apiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  if (!apiKey) throw new Error('OPENAI_API_KEY not set')

  const sourceLang = mapLangCode(options.sourceLang, 'openai')
  const targetLang = mapLangCode(options.targetLang, 'openai')

  const prompt = `Translate the following ${sourceLang} text to ${targetLang}. 
Only return the translation, no explanations, no formatting.
Text: "${options.text}"`

  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a professional manga translator. Translate naturally, preserving tone and context.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI error: ${response.status} - ${err}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || options.text
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

  let translated = 0
  let failed = 0

  for (const page of chapter.pages) {
    for (const bubble of page.bubbles) {
      const existing = bubble.translations.find(t => t.language === targetLang)
      if (existing && !existing.isAuto) continue

      const sourceText = bubble.originalText || ''
      if (!sourceText.trim()) continue

      try {
        const translatedText = await translateText({
          sourceLang,
          targetLang,
          text: sourceText,
        })

        await prisma.translation.upsert({
          where: {
            bubbleId_language: { bubbleId: bubble.id, language: targetLang },
          },
          update: { text: translatedText, isAuto: true },
          create: { bubbleId: bubble.id, language: targetLang, text: translatedText, isAuto: true },
        })
        translated++
      } catch (e) {
        console.error(`Failed to translate bubble ${bubble.id}:`, e)
        failed++
      }
    }
  }

  return { success: true, translated, failed }
}
