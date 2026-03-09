from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
from app.database import engine, Base

from app.routers import auth, medicos, citas

# 1. CREACIÓN DE TABLAS (IMPORTANTE: Descomentado para que funcione en Supabase)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Citas Médicas API", version="1.0.0")

# 2. CONFIGURACIÓN DE CORS (Agregada tu URL de Render)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://citas-medicas-app.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. ROUTERS DEL BACKEND (Deben ir antes del catch-all del frontend)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(medicos.router, prefix="/medicos", tags=["medicos"])
app.include_router(citas.router, prefix="/citas", tags=["citas"])

@app.get("/api/health")
def read_root():
    return {"status": "ok", "message": "Backend conectado correctamente"}

# 4. CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS (FRONTEND)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")

if os.path.exists(STATIC_DIR):
    # Montar la carpeta _next para los chunks de React
    app.mount("/_next", StaticFiles(directory=os.path.join(STATIC_DIR, "_next")), name="next")
    
    # Montar carpetas de recursos si existen
    for static_folder in ["assets", "images", "fonts"]:
        folder_path = os.path.join(STATIC_DIR, static_folder)
        if os.path.exists(folder_path):
            app.mount(f"/{static_folder}", StaticFiles(directory=folder_path), name=static_folder)

    # RUTA CATCH-ALL PARA EL FRONTEND (CORREGIDA)
    @app.get("/{full_path:path}")
    async def serve_frontend(request: Request, full_path: str):
        # PROTECCIÓN: Si la ruta es del API, no debe entrar aquí
        api_prefixes = ["auth", "medicos", "citas", "api"]
        if any(full_path.startswith(prefix) for prefix in api_prefixes):
            # Si llegamos aquí y es una ruta de API, es que no se encontró en los routers
            raise HTTPException(status_code=404, detail="Ruta de API no encontrada")
            
        # Intentar servir el archivo físico
        file_path = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Soporte para rutas de Next.js sin .html
        html_path = f"{file_path}.html"
        if os.path.isfile(html_path):
             return FileResponse(html_path)

        # Fallback para SPA (Single Page Application)
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        raise HTTPException(status_code=404, detail="Archivo no encontrado")