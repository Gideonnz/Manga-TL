'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Image as KonvaImage, Rect, Text, Transformer, Group } from 'react-konva'
import { Edit2, Save, X, Copy, Lang } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Bubble {
  id: string
  x: number
  y: number
  width: number
  height: number
  originalText: string | null
  order: number
  translations: Array<{ language: string; text: string; isAuto: boolean }>
}

interface BubbleEditorProps {
  page: {
    id: string
    number: number
    imagePath: string
    width: number | null
    height: number | null
    bubbles: Bubble[]
  }
  targetLangs: string[]
  showOriginal: boolean
  onSave: (bubbleId: string, lang: string, text: string) => void
}

export function BubbleEditor({ page, targetLangs, showOriginal, onSave }: BubbleEditorProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ width: 800, height: 1200 })
  const [selectedBubble, setSelectedBubble] = useState<Bubble | null>(null)
  const [editingLang, setEditingLang] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [transformerRef, setTransformerRef] = useRef<Konva.Transformer>(null)

  // Image URL
  const imageUrl = `/api/images/${page.imagePath}`

  // Handle container resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setStageSize({ width: Math.max(400, width - 32), height: Math.max(600, height - 32) })
      }
    })
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    return () => resizeObserver.disconnect()
  }, [])

  // Handle bubble click
  const handleBubbleClick = useCallback((bubble: Bubble, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedBubble(bubble)
    setEditingLang(targetLangs[0])
    const translation = bubble.translations.find(t => t.language === targetLangs[0])
    setEditText(translation?.text || bubble.originalText || '')
  }, [targetLangs])

  // Handle stage click (deselect)
  const handleStageClick = useCallback(() => {
    setSelectedBubble(null)
    setEditingLang(null)
  }, [])

  // Save translation
  const handleSave = useCallback(() => {
    if (selectedBubble && editingLang) {
      onSave(selectedBubble.id, editingLang, editText)
      setSelectedBubble(null)
      setEditingLang(null)
    }
  }, [selectedBubble, editingLang, editText, onSave])

  // Get translation for bubble
  const getTranslation = (bubble: Bubble, lang: string) => {
    return bubble.translations.find(t => t.language === lang)?.text || ''
  }

  // Draw bubbles on canvas
  const bubbles = page.bubbles.map((bubble) => {
    const isSelected = selectedBubble?.id === bubble.id
    const translation = getTranslation(bubble, targetLangs[0])
    const displayText = showOriginal ? (bubble.originalText || '') : translation

    return (
      <Group
        key={bubble.id}
        x={(bubble.x / 100) * stageSize.width}
        y={(bubble.y / 100) * stageSize.height}
        onClick={(e) => handleBubbleClick(bubble, e as any)}
      >
        <Rect
          x={0}
          y={0}
          width={(bubble.width / 100) * stageSize.width}
          height={(bubble.height / 100) * stageSize.height}
          fill="rgba(255, 255, 255, 0.9)"
          stroke={isSelected ? '#0ea5e9' : '#0ea5e9'}
          strokeWidth={isSelected ? 3 : 2}
          dash={isSelected ? [] : [5, 5]}
          shadowColor="rgba(0,0,0,0.2)"
          shadowBlur={4}
          shadowOffset={{ x: 0, y: 2 }}
          cornerRadius={4}
        />
        {displayText && (
          <Text
            x={8}
            y={8}
            width={(bubble.width / 100) * stageSize.width - 16}
            height={(bubble.height / 100) * stageSize.height - 16}
            text={displayText}
            fontSize={14}
            fontFamily="'Inter', sans-serif"
            fill="#111827"
            wrap="word"
            lineHeight={1.4}
          />
        )}
        <Text
          x={4}
          y={-20}
          text={`#${bubble.order + 1}`}
          fontSize={10}
          fontFamily="'Inter', sans-serif"
          fill="#6b7280"
        />
      </Group>
    )
  })

  // Transformer for selected bubble
  const transformer = selectedBubble ? (
    <Transformer
      ref={setTransformerRef}
      node={stageRef.current?.findOne(`#${selectedBubble.id}`) as any}
      enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
      rotateEnabled={false}
      boundBoxFunc={(oldBox, newBox) => {
        // Constrain to stage bounds
        if (newBox.x < 0) newBox.x = 0
        if (newBox.y < 0) newBox.y = 0
        if (newBox.x + newBox.width > stageSize.width) {
          newBox.width = stageSize.width - newBox.x
        }
        if (newBox.y + newBox.height > stageSize.height) {
          newBox.height = stageSize.height - newBox.y
        }
        return newBox
      }}
      onTransformEnd={(e) => {
        const node = e.target.node()
        const newX = (node.x() / stageSize.width) * 100
        const newY = (node.y() / stageSize.height) * 100
        const newWidth = (node.width() / stageSize.width) * 100
        const newHeight = (node.height() / stageSize.height) * 100
        
        // Update bubble position/size via API
        fetch(`/api/chapters/bubbles/${selectedBubble.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: newX, y: newY, width: newWidth, height: newHeight }),
        })
      }}
    />
  ) : null

  // Editing panel
  const editingPanel = selectedBubble && editingLang ? (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 bg-white rounded-xl border border-gray-200 shadow-xl p-4 z-50 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Edit Terjemahan</h3>
        <button onClick={() => setSelectedBubble(null)} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Bahasa</label>
        <select
          value={editingLang}
          onChange={(e) => {
            setEditingLang(e.target.value)
            const t = selectedBubble.translations.find(tr => tr.language === e.target.value)
            setEditText(t?.text || selectedBubble.originalText || '')
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {targetLangs.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()} {selectedBubble.translations.find(t => t.language === lang)?.isAuto && '(Auto)'}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Teks Asli (OCR)</label>
        <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 min-h-[3rem] whitespace-pre-wrap">
          {selectedBubble.originalText || '(tidak terdeteksi)'}
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Terjemahan</label>
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="Masukkan terjemahan..."
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-1"
        >
          <Save className="w-4 h-4" />
          Simpan
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(editText)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-1"
        >
          <Copy className="w-4 h-4" />
          Salin
        </button>
      </div>
    </div>
  ) : null

  return (
    <div ref={containerRef} className="relative w-full aspect-[2/3] min-h-[600px] bg-gray-100">
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      )}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        className="konva-stage"
      >
        <Layer>
          <KonvaImage
            image={new Image()}
            src={imageUrl}
            width={stageSize.width}
            height={stageSize.height}
            onLoad={() => setImageLoaded(true)}
            alt={`Page ${page.number}`}
          />
          {bubbles}
          {transformer}
        </Layer>
      </Stage>
      {editingPanel}
      
      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>
    </div>
  )
}
