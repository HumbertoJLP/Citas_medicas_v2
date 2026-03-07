### Despliegue en Render (Recomendado)

El repositorio está listo para subir a [Render](https://render.com) en 1 clic gracias al archivo `render.yaml`. Este lanzará el Backend y el Frontend como dos servicios separados simultáneamente.

1. Entra a tu Dashboard en Render -> `Blueprints` -> `New Blueprint Instance`
2. Conecta tu repositorio de GitHub.
3. Aplica la configuración.
4. **Importante:** Ve al servicio del Backend en Render -> `Environment` y pega la `DATABASE_URL` de tu proyecto Supabase (ya que por seguridad esto no se sube público en el archivo yaml).
