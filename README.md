# Manga TL - Manga Translation Workflow

Production-ready manga translation tool for Vercel + Cloudflare R2 + API-based OCR/MTL.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Vercel    │────▶│  Cloudflare R2   │     │  External   │
│  (Next.js)  │     │  (Images)        │     │  APIs       │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │                        │
                    ┌──────┴──────┐         ┌───────┴────────┐
                    │ PostgreSQL  │         │ OCR: Custom    │
                    │ (Supabase/  │         │ MTL: DeepL,    │
                    │  Neon)      │         │ LibreTranslate,│
                    └─────────────┘         │ Google, OpenAI │
                                            └────────────────┘
```

## Features

- **Series & Chapter Management** - Full CRUD with dashboard
- **Image Upload** - Direct to Cloudflare R2 (S3-compatible)
- **OCR** - Pluggable API (host your own Manga-OCR or use Google Vision/AWS)
- **Bubble Editor** - Visual Konva.js canvas editor
- **Machine Translation** - Multiple providers: DeepL, LibreTranslate, Google, OpenAI-compatible
- **Multi-language** - Multiple target languages per chapter
- **Reader Modes** - Manga (right-to-left) & Webtoon (vertical scroll)
- **Export** - JSON for typesetting workflows
- **Vercel Ready** - Serverless functions, edge compatible

## Quick Start (Vercel)

### 1. Prerequisites
- GitHub account
- Vercel account
- Cloudflare R2 bucket (or AWS S3)
- PostgreSQL database (Supabase, Neon, Railway)
- API keys for OCR & MTL providers

### 2. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Gideonnz/Manga-TL)

Or manually:
```bash
git clone https://github.com/Gideonnz/Manga-TL.git
cd Manga-TL
# Push to your GitHub
# Import in Vercel
```

### 3. Environment Variables (Vercel Dashboard)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Your Vercel URL |
| `ADMIN_PASSWORD` | Yes | Strong password |
| `SESSION_SECRET` | Yes | 32+ char random string |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `R2_ACCOUNT_ID` | Yes | Cloudflare R2 Account ID |
| `R2_ACCESS_KEY_ID` | Yes | R2 Access Key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 Secret Key |
| `R2_BUCKET_NAME` | Yes | Bucket name (e.g., manga-tl) |
| `R2_PUBLIC_URL` | No | Public R2 domain (optional) |
| `OCR_API_URL` | If OCR enabled | Your OCR API endpoint |
| `OCR_API_KEY` | If OCR enabled | OCR API key |
| `MTL_PROVIDER` | If MTL enabled | `deepl`, `libretranslate`, `google`, `openai` |
| `DEEPL_API_KEY` | If DeepL | DeepL API key |
| `LIBRETRANSLATE_URL` | If LibreTranslate | LibreTranslate endpoint |
| `LIBRETRANSLATE_API_KEY` | If LibreTranslate | API key |
| `GOOGLE_TRANSLATE_API_KEY` | If Google | Google Translate API key |
| `OPENAI_API_KEY` | If OpenAI | OpenAI-compatible API key |
| `OPENAI_API_URL` | If OpenAI | API base URL |
| `OPENAI_MODEL` | If OpenAI | Model name (default: gpt-4o-mini) |

### 4. Database Setup

```bash
# Local development
npx prisma db push

# Production - run once after first deploy
npx prisma migrate deploy
```

### 5. R2 CORS Configuration

In Cloudflare R2 dashboard → Bucket → Settings → CORS Policy:
```json
[
  {
    "AllowedOrigins": ["https://your-domain.vercel.app"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Supported Providers

### Machine Translation

| Provider | Env Vars | Notes |
|----------|----------|-------|
| **DeepL** | `DEEPL_API_KEY`, `DEEPL_API_URL` | Best quality, free tier 500k chars/mo |
| **LibreTranslate** | `LIBRETRANSLATE_URL`, `LIBRETRANSLATE_API_KEY` | Self-hosted or public instance |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | Pay per character |
| **OpenAI-compatible** | `OPENAI_API_KEY`, `OPENAI_API_URL`, `OPENAI_MODEL` | OpenRouter, Together, etc. |

### OCR

Host your own Manga-OCR API (FastAPI) or use:
- Google Cloud Vision API
- AWS Textract
- Custom trained model

API Contract:
```json
POST /ocr
{ "image_url": "https://..." }
→ { "bubbles": [{ "x": 10, "y": 20, "width": 30, "height": 15, "text": "...", "confidence": 0.95 }] }
```

## Local Development

```bash
# Install deps
npm install

# Setup env
cp .env.example .env
# Fill in your values

# Database
npx prisma db push

# Dev server
npm run dev
```

## Project Structure

```
manga-tl/
├── app/
│   ├── (app)/           # Protected routes
│   │   ├── dashboard/   # Series/Chapter management
│   │   ├── editor/      # Bubble editor
│   │   └── reader/      # Public reader
│   ├── api/             # Serverless functions
│   │   ├── auth/
│   │   ├── series/
│   │   ├── chapters/
│   │   └── images/
│   └── login/
├── components/
│   ├── editor/          # BubbleEditor (Konva)
│   ├── reader/          # MangaReader
│   └── ui/              # Button, Input, Card
├── lib/
│   ├── prisma.ts        # Prisma client
│   ├── auth.ts          # Iron-session auth
│   ├── storage.ts       # R2/S3 uploads
│   ├── ocr.ts           # OCR API client
│   ├── mtl.ts           # MTL providers
│   └── utils.ts
├── prisma/
│   └── schema.prisma    # PostgreSQL schema
└── package.json
```

## License

MIT
