'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import api from '@/lib/api';
import { JwtPayload } from '@/types';

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

const loginSchema = z.object({
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setIsLoading(true);
        try {
            // Usando request format OAuth2PasswordRequestForm
            const formData = new URLSearchParams();
            formData.append('username', values.email);
            formData.append('password', values.password);

            const response = await api.post('/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const { access_token } = response.data;
            localStorage.setItem('token', access_token);

            const payload = jwtDecode<JwtPayload>(access_token);
            toast.success('Sesión iniciada correctamente');

            if (payload.rol === 'medico') {
                router.push('/medico');
            } else {
                router.push('/paciente');
            }
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Error al iniciar sesión';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-primary/20">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight text-primary">Citas Médicas</CardTitle>
                    <CardDescription>
                        Ingresa tus credenciales para acceder a tu cuenta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Correo Electrónico</FormLabel>
                                        <FormControl>
                                            <Input placeholder="correo@ejemplo.com" {...field} />
                                        </FormControl>
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
                                        <FormControl>
                                            <Input type="password" placeholder="********" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Iniciar Sesión
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4">
                    <p className="text-sm text-muted-foreground">
                        ¿No tienes una cuenta?{' '}
                        <Link href="/registro" className="text-primary font-medium hover:underline">
                            Regístrate aquí
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
