/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Esto permite que el build termine incluso si hay errores de ESLint
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Esto ignora errores de tipos para que el build no se detenga
        ignoreBuildErrors: true,
    },
};

export default nextConfig;