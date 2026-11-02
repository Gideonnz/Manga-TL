import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads'

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
}

export async function saveUploadedFile(
  file: Buffer,
  originalName: string,
  seriesSlug: string,
  chapterNumber: string
): Promise<string> {
  await ensureUploadDir()
  
  const ext = path.extname(originalName).toLowerCase()
  const fileName = `${uuidv4()}${ext}`
  const relativePath = path.join('series', seriesSlug, `ch-${chapterNumber}`, fileName)
  const fullPath = path.join(UPLOAD_DIR, relativePath)
  
  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, file)
  
  return relativePath
}

export async function getFilePath(relativePath: string): Promise<string> {
  return path.join(UPLOAD_DIR, relativePath)
}

export async function deleteFile(relativePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, relativePath)
  try {
    await fs.unlink(fullPath)
  } catch (e) {
    // ignore if not exists
  }
}

export async function deleteChapterFiles(seriesSlug: string, chapterNumber: string): Promise<void> {
  const dirPath = path.join(UPLOAD_DIR, 'series', seriesSlug, `ch-${chapterNumber}`)
  try {
    await fs.rm(dirPath, { recursive: true, force: true })
  } catch (e) {
    // ignore
  }
}

export function getPublicUrl(relativePath: string): string {
  return `/api/images/${relativePath}`
}
