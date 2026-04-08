# 09-deployment

Production deployment trên Railway (hoặc Render) cho FastAPI backend + MongoDB + React frontend. Hỗ trợ scaling khi event có nhiều users.

## Deployment Architecture

```mermaid
graph TB
    Client["🌐 Client<br/>(React App)"]
    CDN["📦 CDN<br/>(Static Assets)"]
    
    Client -->|HTTPS| LB["Load Balancer<br/>(Railway)"]
    LB -->|Socket| API1["FastAPI Pod 1"]
    LB -->|Socket| API2["FastAPI Pod 2"]
    LB -->|Socket| API3["FastAPI Pod N"]
    
    API1 & API2 & API3 -->|MongoDB Driver| DB["🗄️ MongoDB Atlas"]
    API1 & API2 & API3 -->|Cache| Redis["🔴 Redis"]
    
    Client -->|GET /static| CDN
    
    API1 & API2 & API3 -->|Call| TTS["TTS Provider<br/>(FPT/ElevenLabs)"]
```

## 1. Railway Setup

### Create Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create new project
railway init
```

### Deploy FastAPI Backend

**railway.json:**
```json
{
  "buildCommand": "pip install -r requirements.txt",
  "startCommand": "uvicorn src.api.main:app --host 0.0.0.0 --port $PORT"
}
```

**environment variables:**
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
FPT_API_KEY=your-fpt-key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/qadatabase
REDIS_URL=redis://host:6379
SECRET_KEY=random-secret-string
ENVIRONMENT=production
```

**Deploy:**
```bash
railway up
```

---

### Deploy React Frontend

Build and upload to CDN/static hosting:

```bash
cd frontend
npm run build

# Output in build/
# Upload to Railway static service or Vercel/Netlify
```

Or deploy from Railway:

**railway.json (frontend):**
```json
{
  "buildCommand": "npm run build",
  "startCommand": "npm start",
  "buildDir": "build"
}
```

---

## 2. Database Initialization

### Initial Setup

```bash
# MongoDB Atlas: create cluster + database qadatabase
# Then run index bootstrap script
python scripts/init_mongodb_indexes.py
```

### Ongoing Schema Changes

MongoDB khong can migration cho field nho le. Khi them field moi:

```bash
# 1. Cap nhat document validation (neu co)
# 2. Them/doi index neu can
python scripts/init_mongodb_indexes.py
```

---

## 3. Scaling Strategy

### Horizontal Scaling (Add More API Pods)

Railway automatically handles this with replica count:

```yaml
# railway.yml
services:
  api:
    replicas: 3  # Run 3 instances
    resources:
      memory: 512MB
      cpu: 0.5
```

### Connection Pooling

Prevent connection exhaustion with a shared MongoClient:

```python
# src/database.py
from pymongo import MongoClient

MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(
  MONGODB_URI,
  maxPoolSize=50,
  minPoolSize=5,
  serverSelectionTimeoutMS=5000,
)

db = client["qadatabase"]
```

### Redis Caching

Cache frequently accessed data:

```python
import redis

redis_client = redis.from_url(os.getenv("REDIS_URL"))

def get_or_cache_questions(event_id: int):
    cache_key = f"event:{event_id}:questions"
    
    # Try cache first
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Fetch from DB
    questions = list(db.questions.find({"eventId": event_id, "status": "pending"}))
    
    # Cache for 5 minutes
    redis_client.setex(cache_key, 300, json.dumps(questions, default=str))
    
    return questions
```

---

## 4. Monitoring & Logging

### Structured Logging

```python
import logging
import json
from datetime import datetime

logger = logging.getLogger("app")

def log_event(level: str, message: str, **kwargs):
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "level": level.upper(),
        "message": message,
        **kwargs
    }
    logger.log(getattr(logging, level.upper()), json.dumps(log_entry))

# Usage
log_event("info", "Question approved", event_id=1, question_id=123)
log_event("error", "TTS failed", question_id=123, error="API timeout")
```

### Health Check Endpoint

```python
@app.get("/health")
async def health_check():
    """Readiness probe for Railway."""
    try:
        # Check database
      db.command("ping")
        
        # Check Redis
        redis_client.ping()
        
        return {"status": "healthy"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}, 503
```

---

## 5. Security Best Practices

### HTTPS Only

```python
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(HTTPSRedirectMiddleware)
```

### CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/questions")
@limiter.limit("100/minute")
async def create_question(request: Request, q: QuestionCreate):
    ...
```

---

## 6. Disaster Recovery

### Database Backups

MongoDB Atlas cung cap snapshot backup tu dong. To restore:

```bash
# Restore via Atlas snapshot UI or mongorestore
mongorestore --uri "$MONGODB_URI" ./backup
```

### Secrets Management

Never commit `.env`:

```bash
# Add to .gitignore
.env
.env.local

# Use Railway secrets instead (via dashboard)
```

---

## 7. Testing Before Deployment

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run load-test.js
```

**load-test.js:**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  let res = http.post('https://api.yourdomain.com/questions', {
    transcript: 'Test question'
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
```

---

## 8. Post-Deployment Checklist

- [ ] HTTPS working (no mixed content warnings)
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Health check passing
- [ ] WebSocket connections stable
- [ ] TTS API working
- [ ] Monitoring alerts set up
- [ ] Backups running
- [ ] Rate limiting working
- [ ] CORS properly configured

---

## File Reference

| File | Purpose |
|------|---------|
| `railway.json` | Railway deployment config |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `docker-compose.yml` | Local dev environment |
| `requirements.txt` | Python dependencies |
| `src/database.py` | MongoDB client initialization and pooling |

## Cross-References

| Doc | Why |
|-----|-----|
| [00-architecture-overview.md](00-architecture-overview.md) | System overview |
| [02-api-layer.md](02-api-layer.md) | Backend code being deployed |
| [03-database-schema.md](03-database-schema.md) | Database migrations |
