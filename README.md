### Despliegue en Render (Actualizado para Monolito)

El repositorio está listo para subir a [Render](https://render.com) en 1 clic gracias al archivo `render.yaml`. Este lanzará el Backend y el Frontend unificados como un solo servicio que se construye automáticamente.

1. Entra a tu Dashboard en Render -> `Blueprints` -> `New Blueprint Instance`
2. Conecta tu repositorio de GitHub.
3. Aplica la configuración.
4. **Importante:** Ve al servicio `citas-medicas-app` en Render -> `Environment` y pega la `DATABASE_URL` de tu proyecto Supabase.
