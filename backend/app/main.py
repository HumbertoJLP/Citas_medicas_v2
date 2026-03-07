from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base

from app.routers import auth, medicos, citas

# Opcional: Crear tablas si no existen (en Supabase ya están, pero es seguro llamarlo de todos modos, ignora si ya existen)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Citas Médicas API", version="1.0.0")

# CORS Configuration for Next.js Frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(medicos.router)
app.include_router(citas.router)

@app.get("/")
def read_root():
    return {"message": "API de Citas Médicas corriendo correctamente. Visita /docs para la documentación."}
