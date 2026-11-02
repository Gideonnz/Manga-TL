import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { MangaReader } from '@/components/reader/MangaReader'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seriesSlug: string; chapterNum: string }>
}): Promise<Metadata> {
  const { seriesSlug, chapterNum } = await params
  const chapter = await prisma.chapter.findFirst({
    where: {
      series: { slug: seriesSlug },
      number: parseFloat(chapterNum),
    },
    include: { series: true },
  })
  if (!chapter) return { title: 'Chapter tidak ditemukan' }
  return {
    title: `${chapter.series.title} - Ch. ${chapterNum}`,
    description: `Baca ${chapter.series.title} Chapter ${chapterNum}`,
  }
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; chapterNum: string }>
}) {
  const { seriesSlug, chapterNum } = await params
  
  const chapter = await prisma.chapter.findFirst({
    where: {
      series: { slug: seriesSlug },
      number: parseFloat(chapterNum),
    },
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
    <div className="min-h-screen bg-black">
      <MangaReader
        chapter={chapter}
        targetLangs={targetLangs}
        sourceLang={chapter.language}
      />
    </div>
  )
}
