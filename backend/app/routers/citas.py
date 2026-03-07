from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, date, time

from app.database import get_db
from app.models.models import Persona, Cita, TipoRol, EstadoCita, Horario
from app.schemas.schemas import CitaCreate, CitaEstadoUpdate, CitaResponse
from app.auth.jwt import get_current_active_user

router = APIRouter(
    prefix="/citas",
    tags=["Citas"]
)

@router.get("/mis-citas", response_model=List[dict])
def get_mis_citas(current_user: Persona = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if current_user.rol == TipoRol.paciente:
        citas = db.query(Cita).filter(Cita.paciente_id == current_user.id).order_by(Cita.fecha.desc(), Cita.hora_inicio.desc()).all()
    elif current_user.rol == TipoRol.medico:
        citas = db.query(Cita).filter(Cita.medico_id == current_user.id).order_by(Cita.fecha.asc(), Cita.hora_inicio.asc()).all()
    else:
        raise HTTPException(status_code=403, detail="Rol no soportado")
        
    resultado = []
    for cita in citas:
        # Añadir nombres para mostrar en frontend sin hacer peticiones extra
        paciente_obj = cita.paciente_rel.persona
        medico_obj = cita.medico_rel.persona
        
        cita_dict = {
            "id": cita.id,
            "paciente_id": cita.paciente_id,
            "medico_id": cita.medico_id,
            "fecha": cita.fecha,
            "hora_inicio": cita.hora_inicio,
            "hora_fin": cita.hora_fin,
            "estado": cita.estado,
            "motivo": cita.motivo,
            "creado_en": cita.creado_en,
            "paciente_nombre": f"{paciente_obj.nombre} {paciente_obj.apellido}",
            "medico_nombre": f"Dr. {medico_obj.nombre} {medico_obj.apellido}"
        }
        
        if cita.medico_rel.medico_especialidades:
            cita_dict["especialidad_medico"] = cita.medico_rel.medico_especialidades[0].especialidad.nombre
            
        resultado.append(cita_dict)
        
    return resultado

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_cita(cita: CitaCreate, current_user: Persona = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if current_user.rol != TipoRol.paciente:
        raise HTTPException(status_code=403, detail="Solo los pacientes pueden agendar citas")
        
    # Verificar si el dia corresponde a un horario definido para este medico
    dia_semana_python = cita.fecha.weekday() # 0 = Lunes, 6 = Domingo
    
    # Buscar si el medico atiende ese dia
    horario = db.query(Horario).filter(
        Horario.medico_id == cita.medico_id,
        Horario.dia_semana == dia_semana_python
    ).first()
    
    if not horario:
        raise HTTPException(status_code=400, detail="El médico no atiende en el día seleccionado")
        
    # Calcular hora fin
    hora_inicio_dt = datetime.combine(cita.fecha, cita.hora_inicio)
    hora_fin_dt = hora_inicio_dt + timedelta(minutes=horario.duracion_slot_min)
    hora_fin_time = hora_fin_dt.time()
    
    # Validar que la hora esté dentro del rango del horario del medico
    if cita.hora_inicio < horario.hora_inicio or hora_fin_time > horario.hora_fin:
        raise HTTPException(status_code=400, detail="La hora solicitada está fuera del horario de atención del médico")
        
    # Validar colisión de citas (Unique Constraint en DB, pero mejor validar aquí para dar mensaje claro)
    colision = db.query(Cita).filter(
        Cita.medico_id == cita.medico_id,
        Cita.fecha == cita.fecha,
        Cita.hora_inicio == cita.hora_inicio
    ).first()
    
    if colision:
        raise HTTPException(status_code=409, detail="El horario seleccionado ya está ocupado")
        
    # Crear cita
    nueva_cita = Cita(
        paciente_id=current_user.id,
        medico_id=cita.medico_id,
        fecha=cita.fecha,
        hora_inicio=cita.hora_inicio,
        hora_fin=hora_fin_time,
        estado=EstadoCita.pendiente,
        motivo=cita.motivo
    )
    
    db.add(nueva_cita)
    db.commit()
    db.refresh(nueva_cita)
    
    return {"detail": "Cita agendada exitosamente", "cita_id": nueva_cita.id}

@router.patch("/{id}/estado", response_model=dict)
def update_cita_estado(id: int, estado_update: CitaEstadoUpdate, current_user: Persona = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if current_user.rol != TipoRol.medico:
        raise HTTPException(status_code=403, detail="Solo los médicos pueden cambiar el estado de las citas")
        
    cita = db.query(Cita).filter(Cita.id == id).first()
    
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
        
    if cita.medico_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes modificar una cita que no te corresponde")
        
    if estado_update.estado == EstadoCita.pendiente:
        raise HTTPException(status_code=400, detail="No puedes volver a cambiar una cita a estado pendiente")
        
    cita.estado = estado_update.estado
    db.commit()
    
    return {"detail": f"Estado de la cita actualizado a {estado_update.estado.value}"}
