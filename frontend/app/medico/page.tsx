'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, CheckCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import { CitaResponse, EstadoCita } from '@/types';
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function MedicoDashboard() {
    const router = useRouter();
    const [citasHoy, setCitasHoy] = useState<CitaResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchCitas = async () => {
            try {
                const response = await api.get('/citas/mis-citas');
                const citas: CitaResponse[] = response.data;
                const hoy = new Date();

                const hoyList = citas.filter(c => isSameDay(parseISO(c.fecha), hoy));
                // Sort por hora de inicio (ascendente)
                hoyList.sort((a, b) => new Date(`1970-01-01T${a.hora_inicio}`).getTime() - new Date(`1970-01-01T${b.hora_inicio}`).getTime());

                setCitasHoy(hoyList);
            } catch {
                toast.error("Error al cargar la agenda del día");
            } finally {
                setLoading(false);
            }
        }

        fetchCitas();
    }, [router]);

    const updateEstado = async (id: number, estado: string) => {
        try {
            await api.patch(`/citas/${id}/estado`, { estado });
            toast.success("Estado actualizado exitosamente");
            setCitasHoy(prev => prev.map(c => c.id === id ? { ...c, estado: estado as EstadoCita } : c));
        } catch (err) {
            const axiosError = err as import("axios").AxiosError<{ detail: string }>;
            toast.error(axiosError.response?.data?.detail || "Error actualizando cita");
        }
    };

    const statusColorMap = {
        pendiente: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        confirmada: 'bg-blue-50 text-blue-800 border-blue-200',
        completada: 'bg-green-50 text-green-800 border-green-200',
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <NavBar rol="medico" />

            <main className="flex-1 max-w-5xl mx-auto w-full p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center">
                        <Stethoscope className="mr-3 h-8 w-8 text-primary" />
                        Panel de Médico
                    </h1>
                    <p className="text-muted-foreground mt-1">Tu agenda para el día de hoy, {format(new Date(), "d 'de' MMMM", { locale: es })}.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-12">
                    {/* Citas de Hoy */}
                    <div className="md:col-span-8">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center">
                                    <Clock className="mr-2 h-5 w-5" />
                                    Citas de Hoy
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {loading ? (
                                    <p className="text-center text-muted-foreground animate-pulse py-10">Cargando tu agenda...</p>
                                ) : citasHoy.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                        <CheckCircle className="h-10 w-10 mb-3 text-slate-300" />
                                        <p>No tienes citas agendadas para hoy.</p>
                                    </div>
                                ) : (
                                    citasHoy.map(cita => (
                                        <div key={cita.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg shadow-sm ${statusColorMap[cita.estado]}`}>
                                            <div className="mb-4 sm:mb-0">
                                                <p className="font-semibold text-lg">{cita.hora_inicio.slice(0, 5)} - {cita.hora_fin.slice(0, 5)}</p>
                                                <p className="font-medium mt-1">Pcte: {cita.paciente_nombre}</p>
                                                <p className="text-sm opacity-80 mt-1 line-clamp-2" title={cita.motivo}>Motivo: {cita.motivo}</p>
                                            </div>
                                            <div className="w-full sm:w-auto flex flex-col items-end gap-2">
                                                <Select
                                                    defaultValue={cita.estado}
                                                    onValueChange={(val) => val && updateEstado(cita.id, val)}
                                                    disabled={cita.estado === 'completada'}
                                                >
                                                    <SelectTrigger className="w-[160px] bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pendiente" disabled>Pendiente</SelectItem>
                                                        <SelectItem value="confirmada">Confirmar</SelectItem>
                                                        <SelectItem value="completada">Marcar Completada</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-xs font-medium uppercase opacity-70">
                                                    ID Cita: #{cita.id}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Resumen Sidebar */}
                    <div className="md:col-span-4">
                        <Card className="shadow-sm sticky top-24">
                            <CardHeader className="bg-slate-100/50">
                                <CardTitle className="text-lg">Resumen de Hoy</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b">
                                        <span className="text-muted-foreground">Total de Citas</span>
                                        <span className="font-bold text-lg">{citasHoy.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b text-yellow-600">
                                        <span>Pendientes</span>
                                        <span className="font-bold">{citasHoy.filter(c => c.estado === 'pendiente').length}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b text-blue-600">
                                        <span>Confirmadas</span>
                                        <span className="font-bold">{citasHoy.filter(c => c.estado === 'confirmada').length}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-green-600">
                                        <span>Completadas</span>
                                        <span className="font-bold">{citasHoy.filter(c => c.estado === 'completada').length}</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-8"
                                    variant="outline"
                                    onClick={() => router.push('/medico/agenda')}
                                >
                                    Ver Toda Mi Agenda
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
