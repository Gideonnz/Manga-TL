import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ChapterNewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const series = await prisma.series.findUnique({ where: { id } })
  if (!series) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/dashboard/series/${series.id}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Chapter Baru</h1>
        <p className="text-gray-500 mb-6">Series: {series.title}</p>

        <ChapterUploadForm seriesId={series.id} seriesSlug={series.slug} />
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, FileUp, X, Image } from 'lucide-react'

interface ChapterUploadFormProps {
  seriesId: string
  seriesSlug: string
}

export function ChapterUploadForm({ seriesId, seriesSlug }: ChapterUploadFormProps) {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [number, setNumber] = useState('')
  const [title, setTitle] = useState('')
  const [volume, setVolume] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files.length) {
      setError('Pilih minimal 1 gambar')
      return
    }
    if (!number) {
      setError('Nomor chapter wajib diisi')
      return
    }

    setError('')
    setLoading(true)
    setUploadProgress(0)

    try {
      // Create chapter first
      const chapterRes = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId,
          number: parseFloat(number),
          title: title || undefined,
          volume: volume ? parseInt(volume) : undefined,
        }),
      })

      const chapter = await chapterRes.json()
      if (!chapterRes.ok) throw new Error(chapter.error || 'Gagal membuat chapter')

      // Upload images
      const formData = new FormData()
      files.forEach((file) => formData.append('images', file))

      const uploadRes = await fetch(`/api/chapters/${chapter.id}/pages`, {
        method: 'POST',
        body: formData,
      })

      const result = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(result.error || 'Gagal upload gambar')

      router.push(`/editor/${chapter.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
            Nomor Chapter <span className="text-red-500">*</span>
          </label>
          <input
            id="number"
            type="number"
            step="0.5"
            min="0.5"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="1, 1.5, 2, dst."
          />
        </div>
        <div>
          <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-1">
            Volume
          </label>
          <input
            id="volume"
            type="number"
            min="1"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="1, 2, 3, dst."
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Judul Chapter (opsional)
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          placeholder="Contoh: Romance Dawn"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gambar Halaman <span className="text-red-500">*</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
          <input
            type="file"
            id="images"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
          <label htmlFor="images" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              <FileUp className="w-12 h-12 text-gray-400" />
              <p className="text-gray-600">Klik atau drag & drop gambar di sini</p>
              <p className="text-sm text-gray-400">Pilih multiple file (JPG, PNG, WebP)</p>
            </div>
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {files.map((file, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-2 text-sm text-gray-500">{files.length} file dipilih</p>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading || files.length === 0 || !number}
          className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {loading ? `Mengupload... ${uploadProgress}%` : 'Buat Chapter & Upload'}
        </button>
        <Link
          href={`/dashboard/series/${seriesId}`}
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 text-center"
        >
          Batal
        </Link>
      </div>
    </form>
  )
}
