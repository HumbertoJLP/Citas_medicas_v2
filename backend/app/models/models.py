from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date, Time, Enum, Text, UniqueConstraint, SmallInteger, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class TipoRol(str, enum.Enum):
    paciente = "paciente"
    medico = "medico"

class EstadoCita(str, enum.Enum):
    pendiente = "pendiente"
    confirmada = "confirmada"
    completada = "completada"

class Persona(Base):
    __tablename__ = "personas"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    telefono = Column(String, nullable=True)
    rol = Column(Enum(TipoRol), nullable=False)
    activo = Column(Boolean, default=True)
    # creado_en = Column(DateTime(timezone=True), server_default=func.now())

    paciente = relationship("Paciente", back_populates="persona", uselist=False)
    medico = relationship("Medico", back_populates="persona", uselist=False)


class Paciente(Base):
    __tablename__ = "pacientes"

    persona_id = Column(BigInteger, ForeignKey("personas.id"), primary_key=True)
    fecha_nacimiento = Column(Date, nullable=True)
    genero = Column(String, nullable=True)
    tipo_sangre = Column(String, nullable=True)
    alergias = Column(Text, nullable=True)

    persona = relationship("Persona", back_populates="paciente")
    citas = relationship("Cita", back_populates="paciente_rel")


class Medico(Base):
    __tablename__ = "medicos"

    persona_id = Column(BigInteger, ForeignKey("personas.id"), primary_key=True)
    num_licencia = Column(String, unique=True, nullable=False)
    consultorio = Column(String, nullable=True)

    persona = relationship("Persona", back_populates="medico")
    medico_especialidades = relationship("MedicoEspecialidad", back_populates="medico")
    horarios = relationship("Horario", back_populates="medico")
    citas = relationship("Cita", back_populates="medico_rel")


class Especialidad(Base):
    __tablename__ = "especialidades"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String, unique=True, nullable=False)

    medico_especialidades = relationship("MedicoEspecialidad", back_populates="especialidad")


class MedicoEspecialidad(Base):
    __tablename__ = "medico_especialidades"

    medico_id = Column(BigInteger, ForeignKey("medicos.persona_id"), primary_key=True)
    especialidad_id = Column(Integer, ForeignKey("especialidades.id"), primary_key=True)

    medico = relationship("Medico", back_populates="medico_especialidades")
    especialidad = relationship("Especialidad", back_populates="medico_especialidades")


class Horario(Base):
    __tablename__ = "horarios"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    medico_id = Column(BigInteger, ForeignKey("medicos.persona_id"), nullable=False)
    dia_semana = Column(SmallInteger, nullable=False)  # 0=Lun ... 6=Dom
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    duracion_slot_min = Column(SmallInteger, nullable=False)

    medico = relationship("Medico", back_populates="horarios")


class Cita(Base):
    __tablename__ = "citas"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    paciente_id = Column(BigInteger, ForeignKey("pacientes.persona_id"), nullable=False)
    medico_id = Column(BigInteger, ForeignKey("medicos.persona_id"), nullable=False)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    estado = Column(Enum(EstadoCita), default=EstadoCita.pendiente)
    motivo = Column(Text, nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    paciente_rel = relationship("Paciente", back_populates="citas")
    medico_rel = relationship("Medico", back_populates="citas")

    __table_args__ = (
        UniqueConstraint('medico_id', 'fecha', 'hora_inicio', name='_medico_fecha_hora_uc'),
    )
