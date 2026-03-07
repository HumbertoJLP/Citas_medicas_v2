'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import api from '@/lib/api';
import { EspecialidadResponse } from '@/types';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const registroSchema = z.object({
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(6, { message: 'Mínimo 6 caracteres' }),
    nombre: z.string().min(2, { message: 'Requerido' }),
    apellido: z.string().min(2, { message: 'Requerido' }),
    telefono: z.string().optional(),
    rol: z.enum(['paciente', 'medico']),

    // Paciente
    fecha_nacimiento: z.string().optional(),
    genero: z.string().optional(),
    tipo_sangre: z.string().optional(),
    alergias: z.string().optional(),

    // Médico
    num_licencia: z.string().optional(),
    consultorio: z.string().optional(),
    especialidades_ids: z.array(z.number()).optional(),
}).superRefine((data, ctx) => {
    if (data.rol === 'paciente' && !data.fecha_nacimiento) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Requerido para paciente',
            path: ['fecha_nacimiento'],
        });
    }
    if (data.rol === 'medico' && !data.num_licencia) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Requerido para médico',
            path: ['num_licencia'],
        });
    }
});

export default function RegistroPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [especialidades, setEspecialidades] = useState<EspecialidadResponse[]>([]);

    const form = useForm<z.infer<typeof registroSchema>>({
        resolver: zodResolver(registroSchema),
        defaultValues: {
            email: '',
            password: '',
            nombre: '',
            apellido: '',
            telefono: '',
            rol: 'paciente',
            fecha_nacimiento: '',
            genero: '',
            tipo_sangre: '',
            alergias: '',
            num_licencia: '',
            consultorio: '',
            especialidades_ids: [],
        },
    });

    const selectedRol = form.watch('rol');

    useEffect(() => {
        // Si rol es medico, cargar especialidades
        if (selectedRol === 'medico' && especialidades.length === 0) {
            api.get('/especialidades')
                .then(res => setEspecialidades(res.data))
                .catch(err => console.error("Error cargando especialidades:", err));
        }
    }, [selectedRol, especialidades.length]);

    async function onSubmit(values: z.infer<typeof registroSchema>) {
        setIsLoading(true);
        try {
            // Limpiar datos dependiendo del rol
            const dataPayload = { ...values };

            if (values.rol === 'paciente') {
                delete dataPayload.num_licencia;
                delete dataPayload.consultorio;
                delete dataPayload.especialidades_ids;
            } else {
                delete dataPayload.fecha_nacimiento;
                delete dataPayload.genero;
                delete dataPayload.tipo_sangre;
                delete dataPayload.alergias;
                // Solo para MVP permitimos 1 especialidad seleccionada mediante un string desde el UI
                if (dataPayload.especialidades_ids && dataPayload.especialidades_ids.length > 0) {
                    dataPayload.especialidades_ids = [Number(dataPayload.especialidades_ids[0])];
                } else {
                    dataPayload.especialidades_ids = [];
                }
            }

            await api.post('/auth/registro', dataPayload);
            toast.success('Registro exitoso. Por favor inicia sesión.');
            router.push('/login');
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Error al registrarse';
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 py-10">
            <Card className="w-full max-w-2xl shadow-lg border-primary/20">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight text-primary">Crear Cuenta</CardTitle>
                    <CardDescription>
                        Agrega tus datos para usar la plataforma
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="nombre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre</FormLabel>
                                            <FormControl><Input placeholder="Juan" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="apellido"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Apellido</FormLabel>
                                            <FormControl><Input placeholder="Pérez" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Correo Electrónico</FormLabel>
                                            <FormControl><Input placeholder="correo@ejemplo.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contraseña</FormLabel>
                                            <FormControl><Input type="password" placeholder="********" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="telefono"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teléfono</FormLabel>
                                            <FormControl><Input placeholder="+52 123 456 7890" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="rol"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Soy un</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona el rol" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="paciente">Paciente</SelectItem>
                                                    <SelectItem value="medico">Médico</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {selectedRol === 'paciente' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                    <FormField
                                        control={form.control}
                                        name="fecha_nacimiento"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fecha de Nacimiento</FormLabel>
                                                <FormControl><Input type="date" {...field} value={field.value as string} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="genero"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Género</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                                        <SelectItem value="Femenino">Femenino</SelectItem>
                                                        <SelectItem value="Otro">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="tipo_sangre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de Sangre</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="A+">A+</SelectItem>
                                                        <SelectItem value="A-">A-</SelectItem>
                                                        <SelectItem value="B+">B+</SelectItem>
                                                        <SelectItem value="B-">B-</SelectItem>
                                                        <SelectItem value="O+">O+</SelectItem>
                                                        <SelectItem value="O-">O-</SelectItem>
                                                        <SelectItem value="AB+">AB+</SelectItem>
                                                        <SelectItem value="AB-">AB-</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="alergias"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Alergias (Opcional)</FormLabel>
                                                <FormControl><Input placeholder="Polen, Penicilina..." {...field} value={field.value as string} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            {selectedRol === 'medico' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                    <FormField
                                        control={form.control}
                                        name="num_licencia"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nº de Licencia Médica</FormLabel>
                                                <FormControl><Input placeholder="12345678" {...field} value={field.value as string} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="consultorio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Consultorio</FormLabel>
                                                <FormControl><Input placeholder="Edificio Norte, Cons 204" {...field} value={field.value as string} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="especialidades_ids"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Especialidad</FormLabel>
                                                <Select onValueChange={(v) => field.onChange([Number(v)])}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {especialidades.map(esp => (
                                                            <SelectItem key={esp.id} value={esp.id.toString()}>{esp.nombre}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}

                            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Registrarse
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4">
                    <p className="text-sm text-muted-foreground">
                        ¿Ya tienes una cuenta?{' '}
                        <Link href="/login" className="text-primary font-medium hover:underline">
                            Inicia sesión
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
