# Roadmap y deuda

> Este documento es la **fuente de verdad del estado del proyecto**: fases,
> tareas y deudas abiertas. `CLAUDE.md` resume y no duplica: al cerrar una
> fase se actualiza este documento, no el índice.

**Última actualización:** 2026-08-03 (noche)

## Fases

| Fase | Objetivo | Estado |
| --- | --- | --- |
| 0 — Base documental | Contrato instanciado, estructura de docs y specs, ADRs semilla, CI de gates documentales | Activo |
| 1 — Decisión de stack | Lenguaje, framework, gestor de dependencias, despliegue; gates de código en CI | Activo |
| 2 — Andamiaje y dominio | Proyecto construible y explicabilidad de la puntuación | Activo |
| 3 — Migración del artefacto | Traer el comparador React existente y su diseño responsive | Pendiente |

Ninguna fase se da por cerrada mientras tenga tareas abiertas en la tabla de
abajo.

## Fase 0 — Base documental

| Tarea | Estado |
| --- | --- |
| Instanciar el contrato como índice + satélites | Hecha |
| Docs de estado de arquitectura, dominio y despliegue | Hecha (como `Pendiente`) |
| Plantillas de spec y de ADR | Hecha |
| ADR 0001 (formato de logs) y ADR 0002 (modelo de trabajo) | Hecha |
| CI de gates documentales | Hecha — verde en `push` a `main` y en `pull_request` |
| Fijar `main` como rama por defecto del repositorio | Hecha |
| Habilitar GitHub Pages con origen GitHub Actions | Hecha |
| Configurar branch protection en el repositorio | Hecha |

`Hecha (como Pendiente)` significa que el artefacto existe y declara su hueco;
no que el área esté documentada.

## Fase 1 — Decisión de stack

| Tarea | Estado |
| --- | --- |
| ADR 0003: Vite · React · TypeScript · npm · GitHub Pages | Hecha |
| Addendum al ADR 0001: alcance de los logs sin servidor | Hecha |
| Fijar `service.name` (`comparador-coches-web`) | Hecha |
| Aplicación única, no monorepo | Hecha |
| Instalar los gates de código en CI | Hecha — `technical/0001` |
| Ampliar Dependabot al ecosistema `npm` | Hecha — `technical/0001` |
| Decidir si `validate_docs.py` se porta a TypeScript | Hecha — se porta ahora que `technical/0001` está `consolidated` |

## Fase 2 — Andamiaje y dominio

| Tarea | Estado |
| --- | --- |
| `technical/0001` — andamiaje del proyecto y gates de código | `consolidated` |
| `product/0001` — explicabilidad de la puntuación y fuentes | `consolidated` |
| Resolver las decisiones abiertas de `product/0001` | Hecha |
| Gate humano: aprobar ambas specs | Hecha |
| Implementar, verificar y consolidar `technical/0001` | Hecha |
| Sitio desplegado y verificado en GitHub Pages | Hecha — `https://g9tsrctpvg-alt.github.io/app.comparador-coches/` |
| Definir la forma de `cars.json` antes de escribirlo | Hecha — `product/0001` |
| Implementar, verificar y consolidar `product/0001` | Hecha |
| `technical/0002` — robustez del núcleo y desacoplo de la interfaz | `draft` — esperando gate humano |
| Portar `validate_docs.py` a TypeScript | Abierta |

`technical/0001` recorrió el ciclo completo: `approved → implemented →
verified → consolidated`, con los dos últimos criterios de aceptación
—sitio accesible en su URL de Pages, recursos resolviendo sin 404 bajo el
subpath— confirmados contra el despliegue real, no una simulación local.
Su efecto ya se lee en `docs/estado/arquitectura.md` y
`docs/estado/despliegue.md`; la propia spec queda como registro histórico.

`product/0001` recorrió el mismo ciclo completo. Su efecto ya se lee en
`docs/estado/dominio.md` y `docs/estado/interfaz.md` (nuevo); la propia spec
queda como registro histórico.

Una revisión de código posterior a la consolidación encontró cinco defectos
reales en el código que `product/0001` introdujo —el más grave, un catálogo
vacío que hace caer la aplicación entera en vez de mostrar su mensaje de
error—. No son un cambio de comportamiento de la spec consolidada, así que no
se edita: se corrigen por `technical/0002`, hoy en `draft`. Cierran fase 2,
junto al port de `validate_docs.py`, antes de pasar a fase 3.

## Fase 3 — Migración del artefacto

Depende de la fase 2. Tareas conocidas, aún sin spec:

- Traer el artefacto React de un solo fichero al proyecto, extrayendo las
  fórmulas a `src/domain/`.
- Diseño responsive real: hoy está pensado para 560 px de ancho máximo.
- Persistencia en `localStorage` y configuración compartida por URL.
- Objetivar el eje de viaje, hoy el único que sigue siendo un juicio.
- Eje subjetivo de conducción, tras probar los coches.

## Deudas abiertas

Toda deuda conocida se escribe. Una deuda no registrada no es una deuda: es
una sorpresa esperando fecha.

| Deuda | Detectada | Condición de cierre |
| --- | --- | --- |
| Suelo de cobertura sin fijar: no hay tests ni código | 2026-08-01 | Que exista el primer código; se fija por *ratcheting* al nivel que alcance la suite |
| Acciones de GitHub fijadas por etiqueta de major, no por digest; TruffleHog va en `@main` | 2026-08-01 | Fijar cada acción a un SHA y dejar que Dependabot las actualice |
| Tres áreas de estado sin doc (interfaz, modelo de datos, observabilidad) | 2026-08-01 | Que una spec las declare como *Doc de estado*; catálogo en `docs/proceso/consolidacion.md` §4 |
| `validate_docs.py` sigue en Python con el stack ya decidido en TypeScript, y la CI arranca dos runtimes | 2026-08-02 | Portarlo a TypeScript y ejecutarlo con Vitest — ya accionable, `technical/0001` está `consolidated` |
| Precios del catálogo de julio de 2026, sin reconfirmar | 2026-08-02 | Reconfirmar precios contra fuente vigente y actualizar `cars.json` |
| **Disparador cumplido:** los gates de CD (smoke tests, canary) se aplazaban hasta que existiera despliegue real; ya existe (GitHub Pages, verde desde `technical/0001`) | 2026-08-03 | Definir smoke test post-deploy en una spec técnica, o registrar por qué se sigue aplazando |
| `ui/` es la interfaz real del comparador, no andamiaje, pero sigue fuera del suelo de cobertura del 100% y sin tests automatizados propios | 2026-08-03 | Decidir si entra en el suelo de `vite.config.ts` y, si es que sí, escribir sus tests |
| Fila de referencia del Alfa Romeo Giulietta de la especificación original no está en `cars.json`: `product/0001` no la pedía y queda fuera a propósito, no por olvido | 2026-08-03 | Que una spec futura la pida explícitamente como referencia, o se cierre esta fila descartándola |
| `estetica` y `coste` combinan sus sumandos en crudo antes de la única normalización del eje, a diferencia de `prestaciones`/`fiabilidad`; el requisito 7 de `product/0001` nombra los cuatro ejes juntos y es ambiguo sobre si debería aplicarles el mismo patrón. Señalado en el PR de implementación, sin respuesta antes del merge | 2026-08-03 | Confirmación humana explícita de la lectura correcta del requisito 7, o una spec nueva si cambia el cálculo |
| Los datos numéricos del catálogo no declaran cota: un precio o una dimensión negativos validan sin error, justo lo que el ADR 0003 citaba como motivo para elegir Zod. Fuera de alcance de `technical/0002` a propósito: son dieciocho campos con cotas distintas, no una regla global | 2026-08-03 | Decidir la cota de cada campo y declararla en `CarSchema`, con test por campo acotado |
| El andamiaje de los seis ejes está copiado casi literal (mapear candidatos → `normalizeAll` → recorrer con `mustGet` → acotar a 0-10 → construir el `Map`): un cambio en la invariante común exige seis ediciones en paralelo sin que nada las obligue a coincidir | 2026-08-03 | Extraer el andamiaje común a un helper en `breakdown.ts`, o registrar por qué se prefiere la repetición |

## Aplazamientos con disparador

No son deuda: son decisiones conscientes de no hacer algo todavía. El registro
completo está en `docs/proceso/ci-y-guardarrailes.md`, §7, y en las
*Consecuencias* de cada ADR. Se listan aquí solo para no tener que buscarlos:

| Aplazado | Disparador |
| --- | --- |
| SDK completo de OpenTelemetry | Que exista un backend real al que exportar |
| Contract testing y *breaking changes* | Que exista un consumidor externo del contrato |
| Suite E2E | Que la cobertura unitaria deje de detectar las regresiones que importan |
| Cobertura por *diff* | Que el suelo global deje de ser suficiente |
| Hooks de pre-commit locales | Que el ciclo de espera de CI moleste de verdad |
| Persistencia en servidor | Que haga falta compartir estado entre dispositivos sin pasar por la URL |
| *Pre-rendering* y posicionamiento | Que el comparador deje de ser de uso personal |
| Cloudflare Pages en vez de GitHub Pages | Necesitar dominio propio, cabeceras a medida o redirecciones |

Un disparador que se cumple y no se atiende deja de ser aplazamiento y pasa a
la tabla de deudas.
