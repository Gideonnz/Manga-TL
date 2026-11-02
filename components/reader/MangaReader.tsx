'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Download, Globe, Sun, Moon, RotateCcw, Expand } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MangaReaderProps {
  chapter: {
    id: string
    series: { title: string; slug: string }
    number: number
    title: string | null
    pages: Array<{
      id: string
      number: number
      imageKey: string
      bubbles: Array<{
        id: string
        x: number
        y: number
        width: number
        height: number
        originalText: string | null
        order: number
        translations: Array<{ language: string; text: string; isAuto: boolean }>
      }>
    }>
  }
  targetLangs: string[]
  sourceLang: string
}

export function MangaReader({ chapter, targetLangs, sourceLang }: MangaReaderProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [showTranslation, setShowTranslation] = useState(true)
  const [selectedLang, setSelectedLang] = useState(targetLangs[0])
  const [darkMode, setDarkMode] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [readingMode, setReadingMode] = useState<'manga' | 'webtoon'>('manga')

  const pages = chapter.pages
  const totalPages = pages.length

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goPrev()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        goNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const goPrev = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1))
  }, [])

  const goNext = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
  }, [totalPages])

  const currentPageData = pages[currentPage]

  // Image URL
  const imageUrl = currentPageData ? `/api/images/${currentPageData.imageKey}` : ''

  const bubbles = currentPageData?.bubbles || []

  const bubbleOverlays = showTranslation ? bubbles.map((bubble) => {
    const translation = bubble.translations.find(t => t.language === selectedLang)
    const text = translation?.text || bubble.originalText || ''
    if (!text.trim()) return null

    return (
      <div
        key={bubble.id}
        className="absolute pointer-events-none"
        style={{
          left: ${bubble.x}%`,
          top: ${bubble.y}%`,
          width: ${bubble.width}%`,
          height: ${bubble.height}%`,
        }}
      >
        <div
          className={cn(
            'rounded px-2 py-1 text-sm font-medium shadow-lg',
            darkMode
              ? 'bg-white/95 text-gray-900 border border-gray-200'
              : 'bg-gray-900/95 text-white border border-gray-700'
          )}
          style={{
            fontSize: 'clamp(11px, 2vw, 16px)',
            lineHeight: 1.4,
          }}
        >
          {text}
        </div>
      </div>
    )
  }) : null

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div className={cn('min-h-screen transition-colors', darkMode ? 'bg-black' : 'bg-white')}>
      <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent dark:from-black/90">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              aria-label="Kembali"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-white font-semibold truncate max-w-xs">{chapter.series.title}</h1>
              <p className="text-white/70 text-sm">
                Ch. {chapter.number % 1 === 0 ? chapter.number : chapter.number.toFixed(1)}
                {chapter.title && ` - ${chapter.title}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {targetLangs.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              aria-label={showTranslation ? 'Sembunyikan terjemahan' : 'Tampilkan terjemahan'}
            >
              <Globe className="w-5 h-5" />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setReadingMode(readingMode === 'manga' ? 'webtoon' : 'manga')}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <Expand className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="fixed top-16 left-0 right-0 z-30 h-1 bg-gradient-to-r from-primary-600 to-primary-400" style={{ width: ${((currentPage + 1) / totalPages) * 100}%` }} />

      <main className="pt-20 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {readingMode === 'manga' ? (
            <div className="relative">
              <div className="relative aspect-[3/4] bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={imageUrl}
                  alt={`Page ${currentPage + 1}`}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0">{bubbleOverlays}</div>
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={goPrev}
                  disabled={currentPage === 0}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Sebelumnya
                </button>
                <span className="flex items-center text-white/70">
                  Halaman {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={goNext}
                  disabled={currentPage === totalPages - 1}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Selanjutnya
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {pages.map((page, index) => (
                <div key={page.id} className="relative">
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-xl">
                    <img
                      src={`/api/images/${page.imageKey}`}
                      alt={`Page ${page.number}`}
                      className="w-full h-auto object-contain"
                      loading={index > currentPage + 2 ? 'lazy' : 'eager'}
                    />
                    {showTranslation && page.bubbles.map((bubble) => {
                      const translation = bubble.translations.find(t => t.language === selectedLang)
                      const text = translation?.text || bubble.originalText || ''
                      if (!text.trim()) return null
                      return (
                        <div
                          key={bubble.id}
                          className="absolute pointer-events-none"
                          style={{
                            left: ${bubble.x}%`,
                            top: ${bubble.y}%`,
                            width: ${bubble.width}%`,
                            height: ${bubble.height}%`,
                          }}
                        >
                          <div
                            className={cn(
                              'rounded px-2 py-1 text-sm font-medium shadow-lg',
                              darkMode
                                ? 'bg-white/95 text-gray-900 border border-gray-200'
                                : 'bg-gray-900/95 text-white border border-gray-700'
                            )}
                            style={{ fontSize: 'clamp(11px, 2vw, 16px)', lineHeight: 1.4 }}
                          >
                            {text}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent dark:from-black/90">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goPrev}
              disabled={currentPage === 0}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white/70 text-sm">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={goNext}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-white/70" />
          </div>
        </div>
      </footer>
    </div>
  )
}
