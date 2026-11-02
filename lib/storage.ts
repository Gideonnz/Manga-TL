import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'crypto'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'manga-tl'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn('R2 credentials not fully configured. File uploads will fail.')
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
})

export async function uploadFile(
  file: Buffer,
  originalName: string,
  seriesSlug: string,
  chapterNumber: string
): Promise<string> {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${uuidv4()}.${ext}`
  const key = `series/${seriesSlug}/ch-${chapterNumber}/${fileName}`

  await s3Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: getContentType(ext),
    CacheControl: 'public, max-age=31536000, immutable',
  }))

  return key
}

export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }))
}

export async function deleteChapterFiles(seriesSlug: string, chapterNumber: string): Promise<void> {
  // For R2, we'd need to list and delete objects with prefix
  // This is a simplified version - in production use S3 ListObjectsV2 + DeleteObjects
  console.log(`Delete chapter files: ${seriesSlug}/ch-${chapterNumber}`)
}

export function getPublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`
  }
  // Fallback to signed URL (expires in 1 hour)
  return getSignedUrl(s3Client, new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }), { expiresIn: 3600 })
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  return getSignedUrl(s3Client, new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  }), { expiresIn })
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  }
  return types[ext] || 'application/octet-stream'
}
