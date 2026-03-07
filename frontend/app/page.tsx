'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '@/types';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);

      // Check for expiration
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (decoded.rol === 'medico') {
        router.push('/medico');
      } else {
        router.push('/paciente');
      }
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Cargando...</p>
    </div>
  );
}
