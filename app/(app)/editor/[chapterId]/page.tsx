import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Play, Zap, Globe } from 'lucide-react'

export default async function EditorPage({
  params,
}: {
  params: Promise<{ chapterId: string }>
}) {
  const { chapterId } = await params
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      series: true,
      pages: {
        orderBy: { number: 'asc' },
        include: {
          bubbles: {
            orderBy: { order: 'asc' },
            include: { translations: true },
          },
        },
      },
    },
  })

  if (!chapter) notFound()

  const targetLangs = chapter.targetLangs || ['id']

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/series/${chapter.series.id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">{chapter.series.title}</h1>
              <p className="text-sm text-gray-500">
                Chapter {chapter.number % 1 === 0 ? chapter.number : chapter.number.toFixed(1)}
                {chapter.title && ` - ${chapter.title}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/reader/${chapter.series.slug}/${chapter.number}`}
              target="_blank"
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
            >
              <Globe className="w-4 h-4" />
              Preview
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 py-6">
        <EditorClient
          chapterId={chapter.id}
          pages={chapter.pages}
          targetLangs={targetLangs}
          sourceLang={chapter.language}
        />
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Loader2, Download, Zap, Save, Eye, EyeOff, Languages, Globe } from 'lucide-react'
import { BubbleEditor } from '@/components/editor/BubbleEditor'
import { triggerOCR, translateChapter } from '@/lib/api'

interface EditorClientProps {
  chapterId: string
  pages: any[]
  targetLangs: string[]
  sourceLang: string
}

export function EditorClient({ chapterId, pages, targetLangs, sourceLang }: EditorClientProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [loading, setLoading] = useState<'ocr' | 'translate' | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)

  const handleOCR = async () => {
    if (!pages[currentPageIndex]) return
    setLoading('ocr')
    try {
      await triggerOCR(chapterId, pages[currentPageIndex].id)
      window.location.reload()
    } catch (e) {
      alert('OCR gagal: ' + e)
    } finally {
      setLoading(null)
    }
  }

  const handleTranslate = async (lang: string) => {
    setLoading('translate')
    try {
      await translateChapter(chapterId, lang, sourceLang)
      window.location.reload()
    } catch (e) {
      alert('Terjemahan gagal: ' + e)
    } finally {
      setLoading(null)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/chapters/${chapterId}/export?format=json`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${chapterId}.json`
      a.click()
    } catch (e) {
      alert('Export gagal: ' + e)
    }
  }

  const currentPage = pages[currentPageIndex]

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <select
            value={currentPageIndex}
            onChange={(e) => setCurrentPageIndex(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 min-w-[180px]"
          >
            {pages.map((p, i) => (
              <option key={p.id} value={i}>
                Halaman {p.number}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <button
              onClick={handleOCR}
              disabled={loading === 'ocr'}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
            >
              {loading === 'ocr' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              OCR
            </button>
            {targetLangs.map((lang) => (
              <button
                key={lang}
                onClick={() => handleTranslate(lang)}
                disabled={loading === 'translate'}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                {loading === 'translate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1"
            >
              {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showOriginal ? 'Sembunyikan Asli' : 'Tampilkan Asli'}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500 whitespace-nowrap">
          Halaman {currentPageIndex + 1} dari {pages.length}
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {currentPage && (
          <BubbleEditor
            page={currentPage}
            targetLangs={targetLangs}
            showOriginal={showOriginal}
            onSave={(bubbleId, lang, text) => updateTranslation(bubbleId, lang, text)}
          />
        )}
      </div>
    </div>
  )
}

async function updateTranslation(bubbleId: string, lang: string, text: string) {
  try {
    await fetch(`/api/chapters/bubbles/${bubbleId}/translation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang, text, isAuto: false }),
    })
  } catch (e) {
    console.error('Save translation error:', e)
  }
}
