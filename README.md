# Manga TL - Local-First Manga Translation Tool

A complete manga translation workflow running entirely on your machine. No cloud costs, full privacy.

## Features

- **Series & Chapter Management** - Organize manga projects
- **Image Upload** - Drag & drop multiple pages per chapter
- **OCR (Optical Character Recognition)** - Auto-detect text bubbles using Manga-OCR
- **Bubble Editor** - Visual editor to adjust bubble positions and edit translations
- **Machine Translation** - Local LLM via Ollama (qwen2.5, llama3.1) or LibreTranslate
- **Multi-language** - Support for multiple target languages per chapter
- **Reader Mode** - Manga (right-to-left) and Webtoon (vertical scroll) views
- **Export** - JSON export for typesetting workflows
- **Zero Cost** - Runs entirely locally, no API keys needed

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Database**: SQLite (via Prisma ORM)
- **Auth**: Simple password-based (iron-session)
- **Storage**: Local filesystem
- **OCR**: Manga-OCR (Python/FastAPI)
- **MTL**: Ollama (local LLM) + LibreTranslate fallback
- **Editor**: Konva.js (HTML5 Canvas)

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.8+
- (Optional) Docker for containerized services

### 1. Clone & Install

```bash
git clone https://github.com/Gideonnz/Manga-TL.git
cd Manga-TL

# Install Node dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your settings
```

### 2. Database Setup

```bash
# Push schema to SQLite
npm run db:push

# (Optional) Open Prisma Studio
npm run db:studio
```

### 3. Start OCR Service (Terminal 1)

```bash
# Option A: Python script (recommended)
python scripts/setup-ocr.py
# Then run:
source venv-ocr/bin/activate
python ocr_server.py

# Option B: Docker
docker compose up ocr -d
```

### 4. Start MTL Service (Terminal 2)

```bash
# Option A: Ollama (recommended for quality)
./scripts/setup-mtl.sh ollama
# Then in another terminal:
ollama serve

# Option B: LibreTranslate (Docker)
docker compose up libretranslate -d
```

### 4. Start Development Server (Terminal 3)

```bash
npm run dev
```

Open http://localhost:3000

Default password: `changeme123` (change in `.env`)

## Project Structure

```
manga-tl/
├── app/                    # Next.js App Router
│   ├── (app)/             # Protected routes
│   │   ├── dashboard/     # Series/chapter management
│   │   ├── editor/        # Bubble editor
│   │   └── reader/        # Public reader
│   ├── api/               # API routes
│   │   ├── auth/          # Login/logout
│   │   ├── series/        # Series CRUD
│   │   ├── chapters/      # Chapter CRUD + pages/OCR/translate/export
│   │   └── images/        # Image serving
│   └── login/             # Login page
├── components/
│   ├── editor/            # BubbleEditor (Konva canvas)
│   ├── reader/            # MangaReader (manga/webtoon modes)
│   └── ui/                # Button, Input, Card
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # Session management
│   ├── storage.ts         # Local file storage
│   ├── ocr.ts             # OCR API client
│   ├── mtl.ts             # Translation client (Ollama/LibreTranslate)
│   └── api.ts             # Client-side API helpers
├── prisma/
│   └── schema.prisma      # Database schema
├── scripts/
│   ├── setup-ocr.py       # Manga-OCR setup
│   └── setup-mtl.sh       # Ollama/LibreTranslate setup
├── docker-compose.yml     # Containerized services
└── Dockerfile.ocr         # OCR service image
```

## Usage Workflow

1. **Create Series** - Dashboard → "Series Baru"
2. **Add Chapter** - Click series → "Tambah Chapter" → Fill number → Upload images
3. **Run OCR** - Open Editor → Click "OCR" button per page
4. **Review & Edit** - Click bubbles to adjust position/size, edit text
5. **Machine Translate** - Click language button (ID/EN) for auto-translation
6. **Proofread** - Manually fix translations in editor
7. **Export** - Click "Export JSON" for typesetting
8. **Preview** - Click "Preview" to test reader mode

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_PASSWORD` | `changeme123` | Login password |
| `SESSION_SECRET` | - | 32+ char secret |
| `DATABASE_URL` | `file:./data/manga-tl.db` | SQLite path |
| `UPLOAD_DIR` | `./data/uploads` | Image storage |
| `OCR_API_URL` | `http://localhost:8001` | Manga-OCR endpoint |
| `OCR_ENABLED` | `true` | Enable OCR |
| `OLLAMA_API_URL` | `http://localhost:11434` | Ollama endpoint |
| `OLLAMA_MODEL` | `qwen2.5:7b` | Model for translation |
| `MTL_ENABLED` | `true` | Enable MTL |
| `LIBRETRANSLATE_URL` | `http://localhost:5000` | LibreTranslate endpoint |

## Recommended Models

| Model | Size | Best For |
|-------|------|----------|
| `qwen2.5:7b` | 4.7 GB | Japanese→Indonesian (recommended) |
| `qwen2.5:14b` | 9 GB | Higher quality |
| `llama3.1:8b` | 4.9 GB | General purpose |
| `gemma2:9b` | 5.4 GB | Alternative |

Pull with: `ollama pull qwen2.5:7b`

## Production Deployment

### Vercel (Frontend) + VPS (Services)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy OCR/MTL on VPS with Docker Compose
5. Update API URLs in Vercel env vars

### Docker Compose (All-in-one)

```bash
docker compose up -d
```

Requires GPU for OCR/Ollama acceleration (NVIDIA Docker).

## License

MIT - Free for personal and commercial use.

## Contributing

Issues and PRs welcome! This is a personal project but contributions help everyone.
