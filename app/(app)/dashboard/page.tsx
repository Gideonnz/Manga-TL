import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Plus, Edit, Trash2, BookOpen, ChevronRight } from 'lucide-react'

export default async function DashboardPage() {
  const series = await prisma.series.findMany({
    include: {
      _count: { select: { chapters: true } },
      chapters: { take: 1, orderBy: { number: 'desc' } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Series</h1>
        <Link
          href="/dashboard/series/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Series
        </Link>
      </div>

      {series.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada series</h3>
          <p className="text-gray-500 mb-6">Mulai dengan membuat series baru</p>
          <Link
            href="/dashboard/series/new"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Buat Series
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {series.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/series/${s.id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-[3/4] bg-gray-100 relative">
                {s.coverImage ? (
                  <img
                    src={s.coverImage}
                    alt={s.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <BookOpen className="w-12 h-12" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{s.title}</h3>
                {s.author && (
                  <p className="text-sm text-gray-500 mt-1">{s.author}</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    {s._count.chapters} chapter
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
