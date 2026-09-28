from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.memory import router as memory_router
from app.routes.chat import router as chat_router

app = FastAPI(
    title="FarmMemory API",
    description="Voice-first agricultural memory agent",
    version="0.1.0",
)

# Allow the Next.js frontend to communicate with the FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(memory_router)
app.include_router(chat_router)


@app.get("/")
def root():
    return {
        "message": "🌾 FarmMemory API is running!"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }