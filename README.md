# Cognee Memory Hub

A full-stack AI memory application using [Cognee](https://cognee.ai) — the open-source AI memory platform. Store, query, enrich, and delete knowledge using natural language.

Built with **FastAPI** (backend) + **React + Vite** (frontend) + **Google Gemini** (free-tier LLM & embeddings).

---

## Four Pillars

| Pillar    | Description                                                  |
| --------- | ------------------------------------------------------------ |
| Remember  | Store data in Cognee's persistent graph memory               |
| Recall    | Query stored memory with natural language                     |
| Memify    | Enrich and improve the knowledge graph with deeper extraction |
| Forget    | Remove data and clean up memory                               |

---

## Folder Structure

```
cognee-memory-app/
├── .gitignore
├── start.sh
├── README.md
├── backend/
│   ├── app.py              # FastAPI server
│   ├── cognee_client.py    # Cognee wrapper
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Env template
│   └── .env                # Your API keys (git-ignored)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── src/
    │   ├── index.jsx
    │   ├── App.jsx
    │   └── components/
    │       ├── Remember.jsx
    │       ├── Recall.jsx
    │       ├── Memify.jsx
    │       └── Forget.jsx
    └── styles/
        └── App.css
```

---

## Quick Start (Local Development)

### 1. Get a Free API Key

Go to https://aistudio.google.com/apikey and create a Gemini API key.

### 2. Configure

```bash
cd backend
cp .env.example .env
# Edit .env and paste your Gemini API key
```

### 3. Run

```bash
# From the project root — one command:
bash start.sh
```

Or start manually:

```bash
# Terminal 1 - Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### 4. Open

- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Deployment (Render + Vercel)

### Push to GitHub

```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### Backend → Render (free)

1. Go to https://render.com → **New+** → **Web Service**
2. Connect your GitHub repo
3. Fill the form:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (under **Advanced**):
   - `LLM_API_KEY` = your Gemini key
   - `EMBEDDING_API_KEY` = your Gemini key
   - `LLM_PROVIDER` = `gemini`
   - `EMBEDDING_PROVIDER` = `gemini`
   - `LLM_MODEL` = `gemini/gemini-2.0-flash`
   - `EMBEDDING_MODEL` = `gemini/gemini-embedding-001`
   - `EMBEDDING_DIMENSIONS` = `768`
   - `COGNEE_SKIP_CONNECTION_TEST` = `true`
   - `COGNEE_LOG_LEVEL` = `ERROR`
5. Click **Deploy**
6. After deployment, copy your URL (e.g. `https://cognee-backend.onrender.com`)

### Frontend → Vercel (free)

1. Go to https://vercel.com → **Add New** → **Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Framework should auto-detect as **Vite**
5. Add environment variable:
   - `VITE_API_URL` = `https://cognee-backend.onrender.com` (your Render URL, no trailing slash)
6. Click **Deploy**

Done! Your live URL (e.g. `https://cognee-memory-app.vercel.app`) is your hackathon submission link.

---

## Usage Flow

1. **Remember** — paste text to store it in memory
2. **Recall** — ask questions about stored content
3. **Memify** — run enrichment to improve the knowledge graph
4. **Forget** — delete a dataset when no longer needed

---

## Free Tier Models

| Provider | LLM Model | Embeddings | Cost |
|----------|-----------|------------|------|
| Google Gemini | gemini-2.0-flash | gemini-embedding-001 | Free (60 req/min) |
| OpenRouter | gemini-2.0-flash-lite:free | (use Gemini embeddings) | Free |
| Ollama | llama3.2 (local) | nomic-embed-text (local) | Free (no API key) |

---

## Environment Variables

### Backend (in `backend/.env` or Render dashboard)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_API_KEY` | Yes | — | Gemini or OpenRouter API key |
| `LLM_PROVIDER` | No | `gemini` | LLM provider |
| `LLM_MODEL` | No | `gemini/gemini-2.0-flash` | LLM model name |
| `EMBEDDING_API_KEY` | No | falls back to `LLM_API_KEY` | Embedding API key |
| `EMBEDDING_PROVIDER` | No | `gemini` | Embedding provider |
| `EMBEDDING_MODEL` | No | `gemini/gemini-embedding-001` | Embedding model |
| `EMBEDDING_DIMENSIONS` | No | `768` | Embedding vector size |
| `COGNEE_SKIP_CONNECTION_TEST` | No | `true` | Skip 30s preflight check |
| `COGNEE_LOG_LEVEL` | No | `ERROR` | Reduce log noise |

### Frontend (in Vercel dashboard)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Your deployed Render backend URL (e.g. `https://cognee-backend.onrender.com`) |
