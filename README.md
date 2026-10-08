# Food Planning Survey Lab

Encuesta mobile-first para comparar dos planes semanales reales y recopilar evidencia de producto.

## Ejecutar la interfaz localmente

Desde esta carpeta:

```powershell
python -m http.server 5500
```

Abre `http://localhost:5500`.

> Con este servidor puedes revisar toda la experiencia visual, pero el guardado y el dashboard requieren las funciones serverless de Vercel.

## Flujo

1. Contexto del participante.
2. Evaluación del Plan A.
3. Transición explícita a un segundo plan.
4. Evaluación del Plan B.
5. Comparación final.
6. Persistencia en Supabase.

La selección se realiza sin reemplazo. La interfaz elige dos IDs únicos del catálogo y el backend vuelve a validar que `planOrder` no contenga duplicados. Una respuesta con el mismo plan dos veces es rechazada.

## Variables de entorno en Vercel

Copia las variables de `.env.example` y configura:

- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_SECRET_KEY`: secret key (`sb_secret_...`) para uso exclusivo del backend. Nunca debe exponerse al navegador.
- `SURVEYSWAP_COMPLETION_URL`: URL de finalización de SurveySwap, cuando esté disponible.
- `ADMIN_DASHBOARD_KEY`: clave larga y aleatoria para abrir el panel privado de resultados.

## Supabase

Ejecuta `supabase/schema.sql` una sola vez en el SQL Editor de Supabase.

La tabla tiene RLS habilitado y no define políticas públicas. El navegador no habla directamente con Supabase; las operaciones pasan por funciones serverless con la secret key.

## Dashboard

Una vez desplegado, abre:

`https://TU-DOMINIO.vercel.app/results`

Introduce `ADMIN_DASHBOARD_KEY`. El panel muestra:

- respuestas totales, elegibles y descartadas;
- duración media;
- preferencia por plan real (`Q02`, `Q06`), no solo por etiqueta A/B;
- balance del orden de presentación;
- promedios de intención de uso, variedad, esfuerzo, compra y realismo;
- factores de confianza;
- países.

La clave se conserva únicamente en memoria de la pestaña y se envía como `Authorization: Bearer ...` a las funciones privadas.

## Exportaciones

Desde el dashboard puedes descargar:

### JSON

Formato recomendado para continuar el análisis con ChatGPT. Incluye:

- `schema` y fecha de generación;
- resumen agregado;
- respuestas normalizadas;
- etiqueta mostrada A/B;
- ID real del plan preferido;
- ratings, problemas, comentarios y factores de confianza.

Si continúas el proyecto en otro chat, adjunta el JSON más reciente junto con el paquete de continuidad. Permite reconstruir el estado cuantitativo sin depender del dashboard.

### CSV

Formato tabular para Excel, Google Sheets, Python/R o análisis manual. Las respuestas de cada plan quedan aplanadas en columnas.

## Endpoints

- `POST /api/responses`: recibe y valida respuestas.
- `GET /api/results`: estadísticas privadas, requiere `ADMIN_DASHBOARD_KEY`.
- `GET /api/export?format=json`: exportación JSON privada.
- `GET /api/export?format=csv`: exportación CSV privada.

## Seguridad

- La secret key permanece solo en Vercel.
- El dashboard no expone la secret key.
- Los endpoints de resultados y exportación requieren una clave de administración.
- El backend rechaza asignaciones con planes repetidos.
- Se mantiene honeypot básico y límite de payload.
