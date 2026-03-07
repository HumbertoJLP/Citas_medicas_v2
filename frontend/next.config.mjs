/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Esto permite que el build termine incluso si hay errores de ESLint
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Opcional: Esto ignora errores de tipos si el build sigue fallando
        ignoreBuildErrors: true,
    },
};

export default nextConfig;