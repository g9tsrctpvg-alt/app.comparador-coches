# Logging

> Este documento manda sobre **qué es un log en este proyecto**: formato,
> campos, niveles y qué no se escribe nunca. La decisión está registrada en
> `docs/decisions/0001-formato-de-logs.md`; aquí está la regla operativa.

## 1. Formato

1. **Un log = un objeto JSON por línea a `stdout`**, con nombres de campo
   alineados al **OpenTelemetry Logs Data Model** y sus *semantic
   conventions*. `stdout` porque los runtimes modernos capturan la salida
   estándar; no se gestionan ficheros de log.
2. **Sin SDK de OpenTelemetry mientras no exista backend al que exportar.** Se
   emite el JSON «OTel-shaped» con la librería de logging estándar más un
   formateador propio: los logs son exportables a un *collector* el día que
   haga falta **sin reescribirlos**, y hoy no se añade peso ni dependencias.
   Disparador para adoptar el SDK completo: que exista ese backend.
3. **Correlación por petición.** Un middleware asigna `TraceId`/`SpanId` por
   request y todos los logs de esa petición los arrastran; si se llama a un
   servicio externo, se propagan.
4. **Las reglas de cuándo loguear, niveles y redacción son guardarrail 🔴**,
   no recomendación.

## 2. Campos mínimos

| Campo | Origen OTel | Notas |
| --- | --- | --- |
| `Timestamp` | LogRecord | RFC 3339 en **UTC** |
| `SeverityText` / `SeverityNumber` | LogRecord | Nivel textual + numérico OTel |
| `Body` | LogRecord | Mensaje **estático y de baja cardinalidad** |
| `TraceId` / `SpanId` | Context | Correlación por petición |
| `Resource` | Resource | `service.name`, `service.version`, `deployment.environment` |
| `Attributes` | Attributes | Pares clave-valor del evento; sin secretos ni PII |

El valor de `service.name` está **pendiente**: se fija con la decisión de
stack. Ver `docs/roadmap.md`.

Atributos por convención, usando el nombre OTel cuando exista:
`http.request.method`, `url.path`, `http.response.status_code`,
`server.latency_ms`; en integraciones, `provider.request_id` y
`provider.status_code`. La identidad de usuario va como `enduser.id`
**seudonimizada** (hash estable; nunca el identificador del proveedor ni el
email en claro).

> **No se interpolan objetos de dominio en el `Body`.** Se loguean **campos
> explícitos de una allow-list** en `Attributes`, nunca `f"... {objeto}"`.

## 3. Niveles

| Nivel | Cuándo |
| --- | --- |
| `DEBUG` | Solo en local. Detalle de desarrollo, **sin** secretos ni PII igualmente |
| `INFO` | Ciclo de vida y eventos de negocio relevantes (incluye el log de acceso) |
| `WARNING` | Anomalía recuperable; el sistema sigue (reintento, *rate limit*) |
| `ERROR` | Operación fallida o excepción no controlada |
| `CRITICAL` | El servicio no puede operar (falta configuración esencial al arrancar) |

## 4. Cuándo SÍ

- **Una línea de acceso por petición** (middleware): método, ruta, status,
  latencia, `TraceId`. Es la columna vertebral de la explotación.
- **Operaciones que cambian estado:** resultado en **conteos** (insertados,
  actualizados), nunca el contenido.
- **Errores y excepciones** con *stack trace* en `ERROR`, **una sola vez**.
- **Eventos de seguridad y autorización:** fallo de autenticación, acceso
  denegado, credencial o consentimiento expirado.
- **Eventos de negocio relevantes** aun sin error, con `Attributes` de
  allow-list declarada.
- **Fronteras de integración:** identificador de petición, status y latencia
  de la llamada externa; **nunca el payload**.
- **Señales de resiliencia:** reintentos, *backoff*, golpes de *rate limit*.

## 5. Cuándo NO (guardarrail 🔴)

- **Secretos, nunca:** tokens de acceso o refresco, credenciales, claves,
  cabecera `Authorization`, JWT (ni «parcial»).
- **PII en claro.** Si hay que referenciar al usuario, `enduser.id`
  seudonimizado. Identificadores sensibles enmascarados (últimos 4 dígitos).
- **El crudo de un proveedor externo** ni cuerpos de respuesta de terceros.
- **Ruido sin valor:** health checks correctos en `INFO`, logs dentro de
  bucles calientes, «entré/salí de la función» en producción.
- **Escritura directa a consola** (`print` y equivalentes) en código fuente:
  siempre el logger.

## 6. Anti-patrones

- **Doble registro de la misma excepción.** Se loguea en la **frontera** donde
  hay más contexto —handler o caso de uso—, no en cada capa que la propaga.
- **`Body` de alta cardinalidad** (ids o valores en el mensaje): rompe la
  agrupación; esos datos van en `Attributes`.
- **Loguear para depurar y olvidarlo.** El `DEBUG` no viaja a producción.

## 7. Redacción

La seguridad **no depende de acordarse**: se loguean campos de una
**allow-list**, no objetos. Cualquier dato sensible nuevo se clasifica
**antes** de loguearlo.

El escaneo de secretos cubre el **repositorio**; esta disciplina cubre
secretos y PII en **runtime**. Son problemas distintos con soluciones
distintas, y ninguno sustituye al otro.
