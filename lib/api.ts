export async function triggerOCR(chapterId: string, pageId: string) {
  const res = await fetch(`/api/chapters/${chapterId}/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageIds: [pageId] }),
  })
  return res.json()
}

export async function translateChapter(chapterId: string, targetLang: string, sourceLang: string) {
  const res = await fetch(`/api/chapters/${chapterId}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetLang, sourceLang }),
  })
  return res.json()
}
