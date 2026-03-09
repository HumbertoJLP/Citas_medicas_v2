'use client';

import { useState, useEffect } from 'react';
import { NavBar } from '@/components/NavBar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, MapPin, BadgeInfo } from 'lucide-react';
import api from '@/lib/api';
import { MedicoResponse, EspecialidadResponse, HorarioResponse } from '@/types';
import { toast } from 'sonner';

export default function BuscarMedicoPage() {
    const [especialidades, setEspecialidades] = useState<EspecialidadResponse[]>([]);
    const [medicos, setMedicos] = useState<MedicoResponse[]>([]);
    // No guardamos selectedEspecialidad porque no se usa en este componente
    // const [selectedEspecialidad, setSelectedEspecialidad] = useState<string>('all');

    // Dialog state
    const [selectedMedico, setSelectedMedico] = useState<MedicoResponse | null>(null);
    const [horarios, setHorarios] = useState<HorarioResponse[]>([]);
    const [fechaCita, setFechaCita] = useState('');
    const [motivoCita, setMotivoCita] = useState('');
    const [horaSeleccionada, setHoraSeleccionada] = useState<string>('');
    const [loadingCita, setLoadingCita] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    useEffect(() => {
        api.get('/especialidades')
            .then(res => setEspecialidades(res.data))
            .catch(err => console.error("Error loading especialidades", err));

        // Fetch all medicos by default
        fetchMedicos();
    }, []);

    const fetchMedicos = async (esp?: string) => {
        try {
            const url = esp && esp !== 'all' ? `/medicos?especialidad=${esp}` : '/medicos';
            const res = await api.get(url);
            setMedicos(res.data);
        } catch {
            toast.error("Error buscando médicos");
        }
    };

    const handleEspecialidadChange = (val: string) => {
        fetchMedicos(val);
    };

    const openMedicoAgendar = async (medico: MedicoResponse) => {
        setSelectedMedico(medico);
        setHorarios([]);
        setFechaCita('');
        setHoraSeleccionada('');
        setMotivoCita('');
        try {
            const res = await api.get(`/medicos/${medico.persona_id}/horarios`);
            setHorarios(res.data);
            setOpenDialog(true);
        } catch {
            toast.error("Error cargando horarios del médico");
        }
    };

    // Helper para generar slots de tiempo
    const generateTimeSlots = () => {
        if (!fechaCita) return [];

        const dateObj = new Date(fechaCita + 'T12:00:00'); // Evita problemas de timezone locale
        const dayOfWeek = (dateObj.getDay() + 6) % 7; // JavaScript: 0(Dom)..6(Sab). BD: 0(Lun)..6(Dom)
        // Js: Dom(0) -> -1 -> +6 % 7 = 6
        // Js: Lun(1) -> 0 -> +6 % 7 = 0

        const horarioDelDia = horarios.find(h => h.dia_semana === dayOfWeek);
        if (!horarioDelDia) return [];

        const slots = [];
        const start = new Date(`1970-01-01T${horarioDelDia.hora_inicio}`);
        const end = new Date(`1970-01-01T${horarioDelDia.hora_fin}`);

        let current = start;
        while (current.getTime() + horarioDelDia.duracion_slot_min * 60000 <= end.getTime()) {
            slots.push(current.toTimeString().slice(0, 5));
            current = new Date(current.getTime() + horarioDelDia.duracion_slot_min * 60000);
        }

        return slots;
    };

    const handleAgendarSubmit = async () => {
        if (!selectedMedico || !fechaCita || !horaSeleccionada || !motivoCita) {
            toast.error("Por favor completa todos los campos del formulario");
            return;
        }

        setLoadingCita(true);
        try {
            await api.post('/citas', {
                medico_id: selectedMedico.persona_id,
                fecha: fechaCita,
                hora_inicio: horaSeleccionada,
                motivo: motivoCita
            });
            toast.success("Cita agendada exitosamente");
            setOpenDialog(false);
        } catch (err) {
            const axiosError = err as import("axios").AxiosError<{ detail: string }>;
            toast.error(axiosError.response?.data?.detail || "Error al agendar cita");
        } finally {
            setLoadingCita(false);
        }
    };

    const getDayName = (dayIndex: number) => {
        const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        return days[dayIndex];
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <NavBar rol="paciente" />

            <main className="flex-1 max-w-7xl mx-auto w-full p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Directorio Médico</h1>
                    <p className="text-muted-foreground mt-1">Encuentra a tu especialista y agenda una cita ahora mismo.</p>
                </div>

                <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow-sm border">
                    <Search className="h-5 w-5 text-muted-foreground ml-2 hidden sm:block" />
                    <div className="w-full sm:w-1/3">
                        <Select onValueChange={(val) => val && handleEspecialidadChange(val)} defaultValue="all">
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por Especialidad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las especialidades</SelectItem>
                                {especialidades.map(esp => (
                                    <SelectItem key={esp.id} value={esp.nombre}>{esp.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {medicos.length === 0 ? (
                        <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl border-slate-200">
                            <p className="text-muted-foreground text-lg">No se encontraron médicos con esos criterios.</p>
                        </div>
                    ) : (
                        medicos.map(medico => (
                            <Card key={medico.persona_id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 border-b">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">Dr. {medico.persona.nombre} {medico.persona.apellido}</CardTitle>
                                            <p className="text-sm text-primary font-medium mt-1">
                                                {medico.especialidades.map(e => e.nombre).join(', ') || 'Medicina General'}
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="py-4 space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <BadgeInfo className="mr-2 h-4 w-4" />
                                        Licencia: {medico.num_licencia}
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="mr-2 h-4 w-4" />
                                        Consultorio: {medico.consultorio || 'No especificado'}
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-2">
                                    <Button className="w-full" onClick={() => openMedicoAgendar(medico)}>
                                        Ver Disponibilidad
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>

                {/* Dialog agendar cita */}
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Agendar cita con Dr. {selectedMedico?.persona.nombre}</DialogTitle>
                            <DialogDescription>
                                Selecciona la fecha y revisa los horarios disponibles.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {horarios.length === 0 ? (
                                <p className="text-red-500 text-sm">Este médico no tiene horarios configurados de momento.</p>
                            ) : (
                                <div className="text-sm bg-slate-100 p-3 rounded-md mb-4">
                                    <p className="font-semibold mb-1">Días de Atención Comunes:</p>
                                    <ul className="list-disc pl-5">
                                        {horarios.map(h => (
                                            <li key={h.id}>{getDayName(h.dia_semana)}: {h.hora_inicio.slice(0, 5)} a {h.hora_fin.slice(0, 5)}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">1. Selecciona el día</label>
                                <Input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={fechaCita}
                                    onChange={e => {
                                        setFechaCita(e.target.value);
                                        setHoraSeleccionada('');
                                    }}
                                    disabled={horarios.length === 0}
                                />
                            </div>

                            {fechaCita && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">2. Horarios Disponibles (Día seleccionado)</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {generateTimeSlots().length > 0 ? (
                                            generateTimeSlots().map(slot => (
                                                <Button
                                                    key={slot}
                                                    type="button"
                                                    variant={horaSeleccionada === slot ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => setHoraSeleccionada(slot)}
                                                >
                                                    {slot}
                                                </Button>
                                            ))
                                        ) : (
                                            <p className="col-span-4 text-sm text-red-500">El médico no atiende en el día de la semana seleccionado.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {horaSeleccionada && (
                                <div className="space-y-2 mt-4 animate-in fade-in">
                                    <label className="text-sm font-medium">3. Motivo de la Cita</label>
                                    <Input
                                        placeholder="Breve descripción del motivo..."
                                        value={motivoCita}
                                        onChange={e => setMotivoCita(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="sm:justify-end">
                            <Button type="button" variant="secondary" onClick={() => setOpenDialog(false)}>
                                Cancelar
                            </Button>
                            <Button type="button" onClick={handleAgendarSubmit} disabled={!fechaCita || !horaSeleccionada || !motivoCita || loadingCita}>
                                {loadingCita ? 'Agendando...' : 'Confirmar Cita'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </main>
        </div>
    );
}
