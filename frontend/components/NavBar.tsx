'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, CalendarDays, Search, User, ClipboardList } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface NavBarProps {
    rol: 'paciente' | 'medico';
}

export function NavBar({ rol }: NavBarProps) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const links = rol === 'paciente'
        ? [
            { href: '/paciente', label: 'Inicio', icon: User },
            { href: '/paciente/buscar', label: 'Buscar Médico', icon: Search },
            { href: '/paciente/mis-citas', label: 'Mis Citas', icon: CalendarDays },
        ]
        : [
            { href: '/medico', label: 'Agenda de Hoy', icon: ClipboardList },
            { href: '/medico/agenda', label: 'Todas Mis Citas', icon: CalendarDays },
        ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex gap-6 md:gap-10">
                    <Link href={`/${rol}`} className="flex items-center space-x-2">
                        <span className="font-bold sm:inline-block text-primary">CitasMédicas</span>
                    </Link>
                    <nav className="hidden gap-6 md:flex">
                        {links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.href}
                                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <link.icon className="mr-2 h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Salir
                    </Button>
                </div>
            </div>
        </header>
    );
}
