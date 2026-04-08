from fastapi import FastAPI
from .routes import health

app = FastAPI(title="FastAPI Mongo Starter")

# Đăng ký routes
app.include_router(health.router)

@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI MongoDB API"}