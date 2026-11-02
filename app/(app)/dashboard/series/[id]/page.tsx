import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Plus, Edit, Trash2, ChevronRight, ArrowLeft, FileText } from 'lucide-react'

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const series = await prisma.series.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { number: 'asc' },
        include: { _count: { select: { pages: true } } },
      },
    },
  })

  if (!series) notFound()

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {series.coverImage ? (
              <img src={series.coverImage} alt={series.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <FileText className="w-10 h-10" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{series.title}</h1>
            {series.author && (
              <p className="text-gray-500 mt-1">Oleh: {series.author}</p>
            )}
            <p className="text-sm text-gray-400 mt-2">Status: {series.status}</p>
            {series.description && (
              <p className="text-gray-600 mt-3 line-clamp-3">{series.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Chapters ({series.chapters.length})</h2>
        <Link
          href={`/dashboard/series/${series.id}/chapters/new`}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Chapter
        </Link>
      </div>

      {series.chapters.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada chapter</h3>
          <p className="text-gray-500 mb-6">Upload chapter pertama untuk memulai</p>
          <Link
            href={`/dashboard/series/${series.id}/chapters/new`}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Tambah Chapter
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Halaman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {series.chapters.map((chapter) => (
                <tr key={chapter.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Ch. {chapter.number % 1 === 0 ? chapter.number : chapter.number.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {chapter.title || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {chapter._count.pages} halaman
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        chapter.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        chapter.status === 'TRANSLATED' ? 'bg-blue-100 text-blue-800' :
                        chapter.status === 'OCR_DONE' ? 'bg-yellow-100 text-yellow-800' :
                        chapter.status === 'TRANSLATING' ? 'bg-purple-100 text-purple-800' :
                        chapter.status === 'OCR_PROCESSING' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {chapter.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/editor/${chapter.id}`}
                        className="text-primary-600 hover:text-primary-900"
                        title="Editor"
                      >
                        <FileText className="w-5 h-5" />
                      </Link>
                      <Link
                        href={`/dashboard/series/${series.id}/chapters/${chapter.id}`}
                        className="text-gray-600 hover:text-gray-900"
                        title="Detail"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
