from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.models import Medico, Especialidad, MedicoEspecialidad, Horario, Persona, TipoRol
from app.schemas.schemas import MedicoResponse, EspecialidadResponse, HorarioResponse

router = APIRouter(
    tags=["Médicos"]
)

@router.get("/medicos", response_model=List[MedicoResponse])
def get_medicos(especialidad: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Medico).join(Persona).filter(Persona.activo == True, Persona.rol == TipoRol.medico)

    if especialidad:
        query = query.join(MedicoEspecialidad).join(Especialidad).filter(Especialidad.nombre.ilike(f"%{especialidad}%"))
        
    medicos = query.all()
    
    # Transformar a formato de respuesta
    resultado = []
    for medico in medicos:
        esps = [EspecialidadResponse(id=me.especialidad.id, nombre=me.especialidad.nombre) for me in medico.medico_especialidades]
        
        resultado.append(
            MedicoResponse(
                persona_id=medico.persona_id,
                num_licencia=medico.num_licencia,
                consultorio=medico.consultorio,
                persona=medico.persona,
                especialidades=esps
            )
        )
        
    return resultado

@router.get("/medicos/{id}/horarios", response_model=List[HorarioResponse])
def get_medico_horarios(id: int, db: Session = Depends(get_db)):
    # Verificar si el medico existe y es activo
    medico = db.query(Medico).join(Persona).filter(Medico.persona_id == id, Persona.activo == True).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado")
        
    horarios = db.query(Horario).filter(Horario.medico_id == id).all()
    return horarios

@router.get("/especialidades", response_model=List[EspecialidadResponse])
def get_especialidades(db: Session = Depends(get_db)):
    return db.query(Especialidad).order_by(Especialidad.nombre).all()
