'use client';

import { useEffect, useState } from 'react';
import { NavBar } from '@/components/NavBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { CitaResponse } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function MisCitasMedicoPage() {
    const [citas, setCitas] = useState<CitaResponse[]>([]);
    const [filteredCitas, setFilteredCitas] = useState<CitaResponse[]>([]);
    const [filterDate, setFilterDate] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCitas();
    }, []);

    const fetchCitas = async () => {
        try {
            const res = await api.get('/citas/mis-citas');
            setCitas(res.data);
            applyFilter('all', res.data);
        } catch (error) {
            toast.error("Error al cargar historial de citas");
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = (filter: string, data: CitaResponse[] = citas) => {
        setFilterDate(filter);
        if (filter === 'all') {
            setFilteredCitas(data);
            return;
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (filter === 'upcoming') {
            setFilteredCitas(data.filter(c => new Date(c.fecha) >= hoy && c.estado !== 'completada'));
        } else if (filter === 'past') {
            setFilteredCitas(data.filter(c => new Date(c.fecha) < hoy || c.estado === 'completada'));
        }
    };

    const updateEstado = async (id: number, estado: string) => {
        try {
            await api.patch(`/citas/${id}/estado`, { estado });
            toast.success("Estado actualizado exitosamente");
            // Update local states
            const updateList = (list: CitaResponse[]) => list.map(c => c.id === id ? { ...c, estado: estado as any } : c);
            setCitas(updateList);
            setFilteredCitas(updateList);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "Error actualizando cita");
        }
    };

    const statusColorMap = {
        pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        confirmada: 'bg-blue-100 text-blue-800 border-blue-300',
        completada: 'bg-green-100 text-green-800 border-green-300',
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <NavBar rol="medico" />

            <main className="flex-1 max-w-6xl mx-auto w-full p-6">
                <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center">
                        <div className="p-3 bg-white rounded-lg shadow-sm border mr-4 inline-flex">
                            <ClipboardList className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Todas Mis Citas</h1>
                            <p className="text-muted-foreground mt-1">Historial completo de pacientes y citas.</p>
                        </div>
                    </div>

                    <div className="w-[200px] bg-white rounded-md shadow-sm border">
                        <Select value={filterDate} onValueChange={applyFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por fecha" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="upcoming">Próximas</SelectItem>
                                <SelectItem value="past">Pasadas o Completadas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Card className="shadow-md overflow-hidden bg-white border-0">
                    <CardHeader className="bg-slate-50/80 border-b py-4">
                        <CardTitle className="text-lg">Registro Completo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="py-20 text-center animate-pulse text-muted-foreground">Cargando citas...</div>
                        ) : filteredCitas.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center justify-center text-muted-foreground">
                                <Calendar className="h-10 w-10 mb-4 opacity-50" />
                                <p className="text-lg">No hay citas en este rango seleccionado.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>Fecha y Hora</TableHead>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCitas.map((cita) => (
                                        <TableRow key={cita.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {format(parseISO(cita.fecha), "dd MMM, yyyy", { locale: es })}<br />
                                                <span className="text-xs text-muted-foreground">{cita.hora_inicio.slice(0, 5)} - {cita.hora_fin.slice(0, 5)}</span>
                                            </TableCell>
                                            <TableCell className="font-medium">{cita.paciente_nombre}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={cita.motivo}>{cita.motivo}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${statusColorMap[cita.estado]} font-semibold`}>
                                                    {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right flex justify-end">
                                                <Select
                                                    value={cita.estado}
                                                    onValueChange={(val) => updateEstado(cita.id, val)}
                                                    disabled={cita.estado === 'completada'}
                                                >
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pendiente" disabled>Pendiente</SelectItem>
                                                        <SelectItem value="confirmada">Confirmar</SelectItem>
                                                        <SelectItem value="completada">Completar</SelectItem>
                                                    </SelectContent>
                                                </Select>
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
