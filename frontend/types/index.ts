export type TipoRol = 'paciente' | 'medico';

export type EstadoCita = 'pendiente' | 'confirmada' | 'completada';

export interface PersonaResponse {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    rol: TipoRol;
    activo: boolean;
}

export interface EspecialidadResponse {
    id: number;
    nombre: string;
}

export interface MedicoResponse {
    persona_id: number;
    num_licencia: string;
    consultorio?: string;
    persona: PersonaResponse;
    especialidades: EspecialidadResponse[];
}

export interface HorarioResponse {
    id: number;
    dia_semana: number;
    hora_inicio: string; // "HH:MM:SS"
    hora_fin: string;
    duracion_slot_min: number;
}

export interface CitaResponse {
    id: number;
    paciente_id: number;
    medico_id: number;
    fecha: string; // "YYYY-MM-DD"
    hora_inicio: string; // "HH:MM:SS"
    hora_fin: string;
    estado: EstadoCita;
    motivo?: string;
    creado_en: string;
    paciente_nombre?: string;
    medico_nombre?: string;
    especialidad_medico?: string;
}

export interface JwtPayload {
    id: number;
    email: string;
    rol: TipoRol;
    exp: number;
}
