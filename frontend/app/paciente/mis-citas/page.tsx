'use client';

import { useEffect, useState } from 'react';
import { NavBar } from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { CitaResponse } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function MisCitasPacientePage() {
    const [citas, setCitas] = useState<CitaResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCitas();
    }, []);

    const fetchCitas = async () => {
        try {
            const res = await api.get('/citas/mis-citas');
            setCitas(res.data);
        } catch {
            toast.error("Error al cargar historial de citas");
        } finally {
            setLoading(false);
        }
    };

    const statusColorMap = {
        pendiente: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300',
        confirmada: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300',
        completada: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300',
    };

    const statusNameMap = {
        pendiente: 'Pendiente',
        confirmada: 'Confirmada',
        completada: 'Completada',
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <NavBar rol="paciente" />

            <main className="flex-1 max-w-6xl mx-auto w-full p-6">
                <div className="mb-8 flex items-center mb-6">
                    <div className="p-3 bg-white rounded-lg shadow-sm border mr-4 inline-flex">
                        <ClipboardList className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mis Citas</h1>
                        <p className="text-muted-foreground mt-1">Revisa el historial y estado de todas tus atenciones.</p>
                    </div>
                </div>

                <Card className="shadow-md overflow-hidden bg-white border-0">
                    <CardHeader className="bg-slate-50/80 border-b py-4">
                        <CardTitle className="text-lg">Registro Completo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-20 text-center animate-pulse text-muted-foreground">Cargando citas...</div>
                        ) : citas.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center justify-center text-muted-foreground">
                                <Calendar className="h-10 w-10 mb-4 opacity-50" />
                                <p className="text-lg">Aún no has agendado ninguna cita.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Fecha y Hora</TableHead>
                                        <TableHead>Médico</TableHead>
                                        <TableHead>Especialidad</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {citas.map((cita) => (
                                        <TableRow key={cita.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium">
                                                {format(parseISO(cita.fecha), "d 'de' MMMM, yyyy", { locale: es })}<br />
                                                <span className="text-xs text-muted-foreground">{cita.hora_inicio.slice(0, 5)} - {cita.hora_fin.slice(0, 5)}</span>
                                            </TableCell>
                                            <TableCell>{cita.medico_nombre}</TableCell>
                                            <TableCell>{cita.especialidad_medico || 'General'}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={cita.motivo}>{cita.motivo}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${statusColorMap[cita.estado]} font-semibold`}>
                                                    {statusNameMap[cita.estado]}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
