'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarPlus, CalendarClock } from 'lucide-react';
import api from '@/lib/api';
import { CitaResponse } from '@/types';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function PacienteDashboard() {
    const router = useRouter();
    const [proximaCita, setProximaCita] = useState<CitaResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only check if we are unauthenticated or if it's the right role based on token
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchCitas = async () => {
            try {
                const response = await api.get('/citas/mis-citas');
                const citas: CitaResponse[] = response.data;
                // Filtrar citas pendientes o confirmadas, y encontrar la más próxima (fecha mayor o igual a hoy)
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);

                const futuras = citas.filter(c => {
                    if (c.estado === 'completada') return false;
                    return new Date(c.fecha) >= hoy;
                });

                if (futuras.length > 0) {
                    // Asumiendo que vienen ordenadas de api, tomamos la primera futura
                    setProximaCita(futuras[futuras.length - 1]); // the nearest one if sorted desc, actually API returns desc. Let's find min diff
                    // To be precise, sort asc
                    futuras.sort((a, b) => new Date(`${a.fecha}T${a.hora_inicio}`).getTime() - new Date(`${b.fecha}T${b.hora_inicio}`).getTime());
                    setProximaCita(futuras[0]);
                }
            } catch (error) {
                toast.error("Error al cargar la información");
            } finally {
                setLoading(false);
            }
        }

        fetchCitas();
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <NavBar rol="paciente" />

            <main className="flex-1 max-w-5xl mx-auto w-full p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bienvenido a tu Portal</h1>
                    <p className="text-muted-foreground mt-1">Gestiona tus citas médicas rápida y fácilmente.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Próxima cita card */}
                    <Card className="col-span-1 shadow-sm border-blue-100">
                        <CardHeader className="bg-blue-50/50 rounded-t-lg border-b border-blue-100 pb-4">
                            <CardTitle className="text-blue-800 flex items-center">
                                <CalendarClock className="mr-2 h-5 w-5" />
                                Próxima Cita
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 min-h-[160px] flex flex-col justify-center">
                            {loading ? (
                                <p className="text-center text-muted-foreground animate-pulse">Cargando...</p>
                            ) : proximaCita ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Fecha y Hora</p>
                                        <p className="text-lg font-semibold">
                                            {format(parseISO(proximaCita.fecha), 'dd/MM/yyyy')} a las {proximaCita.hora_inicio.slice(0, 5)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Médico</p>
                                        <p className="font-medium">{proximaCita.medico_nombre}</p>
                                        <p className="text-sm text-muted-foreground">{proximaCita.especialidad_medico}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4 py-4">
                                    <p className="text-muted-foreground">No tienes citas próximas agendadas.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Acciones card */}
                    <Card className="col-span-1 shadow-sm">
                        <CardHeader>
                            <CardTitle>Acciones Rápidas</CardTitle>
                            <CardDescription>¿Qué te gustaría hacer hoy?</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <Button
                                size="lg"
                                className="w-full h-16 text-lg justify-start px-6"
                                onClick={() => router.push('/paciente/buscar')}
                            >
                                <CalendarPlus className="mr-4 h-6 w-6" />
                                Agendar nueva cita
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
