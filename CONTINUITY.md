# Food Planning Survey Lab — Continuidad

## Estado actual

La encuesta compara dos planes distintos del catálogo (`Q02` y `Q06`) con orden aleatorio y selección sin reemplazo. El backend valida la unicidad del orden antes de persistir.

## Arquitectura

- `index.html`: encuesta completa.
- `api/responses.js`: validación y persistencia.
- `results.html`: dashboard privado.
- `api/results.js`: agregados del dashboard.
- `api/export.js`: exportación JSON/CSV.
- `lib/admin-data.js`: acceso privado a Supabase, normalización y estadísticas.
- `supabase/schema.sql`: tabla de respuestas.

## Continuidad de análisis

El artefacto canónico para llevar evidencia entre chats es el JSON descargado desde **Exportar JSON** en `/results`.

Su esquema se identifica como:

`food-planning-survey-export/v1`

Incluye `stats` y `responses`. `preferredRealPlan` resuelve A/B al ID real del plan para que el análisis no confunda posición de presentación con variante evaluada.

## Próximo flujo recomendado

1. Crear/configurar Supabase y ejecutar `supabase/schema.sql`.
2. Configurar variables en Vercel.
3. Desplegar.
4. Enviar una respuesta de prueba completa.
5. Verificar `/results`.
6. Descargar JSON y CSV de prueba.
7. Configurar URL de finalización de SurveySwap.
8. Publicar la encuesta.
