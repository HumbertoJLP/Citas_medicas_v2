from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, time, datetime
import enum

class TipoRol(str, enum.Enum):
    paciente = "paciente"
    medico = "medico"

class EstadoCita(str, enum.Enum):
    pendiente = "pendiente"
    confirmada = "confirmada"
    completada = "completada"

# --- AUTH & PERSONA ---

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    nombre: str
    apellido: str
    telefono: Optional[str] = None
    rol: TipoRol
    
    # Campo para paciente
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    tipo_sangre: Optional[str] = None
    alergias: Optional[str] = None
    
    # Campo para medico
    num_licencia: Optional[str] = None
    consultorio: Optional[str] = None
    especialidades_ids: Optional[List[int]] = []

class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    id: Optional[int] = None
    email: Optional[str] = None
    rol: Optional[str] = None

class PersonaResponse(BaseModel):
    id: int
    email: EmailStr
    nombre: str
    apellido: str
    telefono: Optional[str] = None
    rol: TipoRol
    activo: bool
    
    class Config:
        from_attributes = True

# --- ESPECIALIDAD ---

class EspecialidadResponse(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True

# --- MEDICO ---

class HorarioResponse(BaseModel):
    id: int
    dia_semana: int
    hora_inicio: time
    hora_fin: time
    duracion_slot_min: int

    class Config:
        from_attributes = True

class MedicoResponse(BaseModel):
    persona_id: int
    num_licencia: str
    consultorio: Optional[str] = None
    persona: PersonaResponse
    especialidades: List[EspecialidadResponse] = []

    class Config:
        from_attributes = True

# --- CITA ---

class CitaCreate(BaseModel):
    medico_id: int
    fecha: date
    hora_inicio: time
    motivo: str

class CitaEstadoUpdate(BaseModel):
    estado: EstadoCita

class CitaResponse(BaseModel):
    id: int
    paciente_id: int
    medico_id: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    estado: EstadoCita
    motivo: Optional[str] = None
    creado_en: datetime
    
    # Opcionales para anidar información al devolver listados
    paciente_nombre: Optional[str] = None
    medico_nombre: Optional[str] = None
    especialidad_medico: Optional[str] = None

    class Config:
        from_attributes = True
