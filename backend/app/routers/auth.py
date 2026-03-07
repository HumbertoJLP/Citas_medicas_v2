from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm

from app.database import get_db
from app.models.models import Persona, Paciente, Medico, MedicoEspecialidad, TipoRol
from app.schemas.schemas import UserRegister, Token, PersonaResponse, UserLogin
from app.auth.jwt import get_password_hash, verify_password, create_access_token, get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/registro", status_code=status.HTTP_201_CREATED)
def register(user: UserRegister, db: Session = Depends(get_db)):
    # Verificar si el email ya existe
    db_user = db.query(Persona).filter(Persona.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    # Crear nueva persona
    hashed_password = get_password_hash(user.password)
    nueva_persona = Persona(
        email=user.email,
        password_hash=hashed_password,
        nombre=user.nombre,
        apellido=user.apellido,
        telefono=user.telefono,
        rol=user.rol
    )
    db.add(nueva_persona)
    db.commit()
    db.refresh(nueva_persona)

    # Crear detalles del rol
    if user.rol == TipoRol.paciente:
        nuevo_paciente = Paciente(
            persona_id=nueva_persona.id,
            fecha_nacimiento=user.fecha_nacimiento,
            genero=user.genero,
            tipo_sangre=user.tipo_sangre,
            alergias=user.alergias
        )
        db.add(nuevo_paciente)
    elif user.rol == TipoRol.medico:
        nuevo_medico = Medico(
            persona_id=nueva_persona.id,
            num_licencia=user.num_licencia,
            consultorio=user.consultorio
        )
        db.add(nuevo_medico)
        db.commit() # Commit para poder enlazar especialidades
        
        # Enlazar especialidades
        if user.especialidades_ids:
            for esp_id in user.especialidades_ids:
                med_esp = MedicoEspecialidad(medico_id=nueva_persona.id, especialidad_id=esp_id)
                db.add(med_esp)
                
    db.commit()
    
    return {"detail": "Usuario registrado exitosamente"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm usa username en vez de email, pero el cliente mandará email ahí
    user = db.query(Persona).filter(Persona.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_payload = {
        "id": user.id,
        "email": user.email,
        "rol": user.rol.value
    }
    
    access_token = create_access_token(
        data=token_payload, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=PersonaResponse)
def read_users_me(current_user: Persona = Depends(get_current_active_user)):
    return current_user
