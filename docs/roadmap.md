# Roadmap y deuda

> Este documento es la **fuente de verdad del estado del proyecto**: fases,
> tareas y deudas abiertas. `CLAUDE.md` resume y no duplica: al cerrar una
> fase se actualiza este documento, no el índice.

**Última actualización:** 2026-08-04

## Fases

| Fase | Objetivo | Estado |
| --- | --- | --- |
| 0 — Base documental | Contrato instanciado, estructura de docs y specs, ADRs semilla, CI de gates documentales | Cerrada |
| 1 — Decisión de stack | Lenguaje, framework, gestor de dependencias, despliegue; gates de código en CI | Cerrada |
| 2 — Andamiaje y dominio | Proyecto construible y explicabilidad de la puntuación | Cerrada |
| 3 — Migración del artefacto | Traer el comparador React existente y su diseño responsive | Activo |

Ninguna fase se da por cerrada mientras tenga tareas abiertas en la tabla de
abajo. Las tres primeras ya no tienen ninguna; la deuda que dejaron vive en
*Deudas abiertas*, que no pertenece a ninguna fase.

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
| `technical/0002` — robustez del núcleo y desacoplo de la interfaz | `consolidated` |
| `technical/0003` — validador de documentación en TypeScript | `consolidated` |

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
se edita: se corrigen por `technical/0002`, ya `consolidated`.

`technical/0003` cerró lo último que le quedaba a la fase: el validador de
documentación es TypeScript bajo Vitest y la CI corre sobre un único
*runtime*. **Fase 2 cerrada.** Lo siguiente es fase 3, que aún no tiene
spec.

## Fase 3 — Migración del artefacto

| Tarea | Estado |
| --- | --- |
| ADR 0004 — puntuación en escala absoluta, no relativa al conjunto | `draft` — esperando gate humano |
| `product/0002` — el eje de uso diario, en escala absoluta | `draft` — sin decisiones abiertas, esperando gate humano |
| `product/0003` — el eje de coste, en dos escalas absolutas | `draft` — sin decisiones abiertas, esperando gate humano |
| `product/0004` — el eje de estética, sin normalización | `draft` — sin decisiones abiertas, esperando gate humano |

Tareas conocidas, aún sin spec:

- Traer el artefacto React de un solo fichero al proyecto, extrayendo las
  fórmulas a `src/domain/`.
- **Página que explique cómo se calcula todo.** Hoy el desglose por eje
  responde «de dónde sale este número» coche a coche, pero no hay ningún
  sitio que explique el modelo entero de una vez: qué mide cada eje, cómo se
  normaliza contra el conjunto, por qué unos ejes normalizan por sumando y
  otros no, qué significan los pesos y qué supuestos entran en el coste. Es
  contenido distinto del desglose, no un resumen de él.
- Diseño responsive real: hoy está pensado para 560 px de ancho máximo.
- Persistencia en `localStorage` y configuración compartida por URL.
- Objetivar el eje de viaje, hoy el único que sigue siendo un juicio.
- Eje subjetivo de conducción, tras probar los coches.

## Deudas abiertas

Toda deuda conocida se escribe. Una deuda no registrada no es una deuda: es
una sorpresa esperando fecha.

| Deuda | Detectada | Condición de cierre |
| --- | --- | --- |
| Acciones de GitHub fijadas por etiqueta de major, no por digest; TruffleHog va en `@main` | 2026-08-01 | Fijar cada acción a un SHA y dejar que Dependabot las actualice |
| Dos áreas de estado sin doc (modelo de datos, observabilidad); `interfaz` ya existe desde `product/0001` | 2026-08-01 | Que una spec las declare como *Doc de estado*; catálogo en `docs/proceso/consolidacion.md` §4 |
| Precios del catálogo de julio de 2026, sin reconfirmar | 2026-08-02 | Reconfirmar precios contra fuente vigente y actualizar `cars.json` |
| **Disparador cumplido:** los gates de CD (smoke tests, canary) se aplazaban hasta que existiera despliegue real; ya existe (GitHub Pages, verde desde `technical/0001`) | 2026-08-03 | Definir smoke test post-deploy en una spec técnica, o registrar por qué se sigue aplazando |
| `ui/` sigue fuera del suelo de cobertura del 100%. Desde `technical/0002` sí tiene tests, pero solo de los fallos que aquella spec corrigió, y sin interacción: `renderToStaticMarkup` no hace clic ni arrastra, así que lo interactivo se sigue comprobando a mano | 2026-08-03 | Decidir si entra en el suelo de `vite.config.ts`, y si hacen falta jsdom o *testing library* para cubrir la interacción |
| Fila de referencia del Alfa Romeo Giulietta de la especificación original no está en `cars.json`: `product/0001` no la pedía y queda fuera a propósito, no por olvido | 2026-08-03 | Que una spec futura la pida explícitamente como referencia, o se cierre esta fila descartándola |
| La puntuación de todos los ejes es relativa al conjunto de candidatos: la nota dice en qué puesto va un coche, no si el coche es bueno. Amplifica diferencias irrelevantes —64 mm de anchura estirados a toda la escala—, esconde que los once son parecidos, y entierra al candidato equilibrado. En `diario` además invierte los pesos declarados: 0,6/0,4 acaba siendo 19%/81% | 2026-08-04 | ADR 0004 fija el principio; luego una spec por eje con sus anclajes. `diario` va primero (`product/0002`) |
| Los datos numéricos del catálogo no declaran cota: un precio o una dimensión negativos validan sin error, justo lo que el ADR 0003 citaba como motivo para elegir Zod. Fuera de alcance de `technical/0002` a propósito: son dieciocho campos con cotas distintas, no una regla global | 2026-08-03 | Decidir la cota de cada campo y declararla en `CarSchema`, con test por campo acotado |
| Al quitar `anios` (`product/0003`), la fórmula de valor residual —`precio × res^(años/5)`— se queda sin horizonte. Hoy no molesta porque «pienso venderlo» está desactivado y la reventa está fuera de alcance, pero la función queda inservible tal como está escrita | 2026-08-04 | Que alguien quiera analizar la reventa: entonces, spec propia que decida con qué horizonte se calcula |
| `index.html` no declara icono, así que el navegador pide `/favicon.ico` en cada carga y se lleva un 404. Cosmético y preexistente desde `technical/0001` | 2026-08-03 | Añadir un icono, o declarar explícitamente que no se quiere |
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
