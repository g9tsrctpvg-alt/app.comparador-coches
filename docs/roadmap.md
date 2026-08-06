# Roadmap y deuda

> Este documento es la **fuente de verdad del estado del proyecto**: fases,
> tareas y deudas abiertas. `CLAUDE.md` resume y no duplica: al cerrar una
> fase se actualiza este documento, no el índice.

**Última actualización:** 2026-08-06

## Fases

| Fase | Objetivo | Estado |
| --- | --- | --- |
| 0 — Base documental | Contrato instanciado, estructura de docs y specs, ADRs semilla, CI de gates documentales | Cerrada |
| 1 — Decisión de stack | Lenguaje, framework, gestor de dependencias, despliegue; gates de código en CI | Cerrada |
| 2 — Andamiaje y dominio | Proyecto construible y explicabilidad de la puntuación | Cerrada |
| 3 — Puntuación en escala absoluta | Que la nota diga si un coche es bueno, no en qué puesto va de once | Activa |
| 4 — Migración del artefacto | Traer el comparador React existente y su diseño responsive | Pendiente |

Ninguna fase se da por cerrada mientras tenga tareas abiertas en la tabla de
abajo. Las tres primeras ya no tienen ninguna; la deuda que dejaron vive en
*Deudas abiertas*, que no pertenece a ninguna fase.

**La fase 3 era «Migración del artefacto» hasta el 2026-08-06.** Se renumeró
a 4 al abrirse el rediseño de la puntuación, que va delante por dos motivos:
está aprobado y listo para implementar mientras la migración no ha empezado,
y una de las tareas de la migración —la página que explica los cálculos— no
se puede escribir hasta que los ejes sean los definitivos. Son trabajos
independientes; el orden es de conveniencia, no de dependencia técnica salvo
en ese punto. Se deja escrito porque un número de fase que cambia de
significado sin aviso es una trampa para quien lea esto después.

Trabajo conocido que **no pertenece a ninguna fase** —alcance nuevo, no tareas
pendientes de una fase abierta— vive en *Más adelante*.

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
| Acotar el ADR 0001: alcance de los logs sin servidor | Hecha |
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
*runtime*. **Fase 2 cerrada.**

## Fase 3 — Puntuación en escala absoluta

| Tarea | Estado |
| --- | --- |
| ADR 0004 — puntuación en escala absoluta, no relativa al conjunto | `approved` |
| `product/0002` — el eje de uso diario, en escala absoluta | `approved` |
| `product/0003` — el eje de coste, en dos escalas absolutas | `approved` |
| `product/0004` — el eje de estética, sin normalización | `approved` |
| `product/0005` — el eje de viaje, objetivado en dos escalas absolutas | `approved` |
| `product/0006` — el eje de prestaciones, en dos escalas absolutas | `approved` |
| `product/0007` — el eje de fiabilidad, en dos escalas absolutas | `approved` — cierra los seis ejes |
| Gate humano: aprobar el ADR y las seis specs de eje | Hecha — 2026-08-05, en commit propio sin implementación |
| Actualizar el catálogo con lo que las specs exigen | Hecha — batalla, garantía, índice OCU y versión del CR-V |
| Implementar, verificar y consolidar los seis ejes | En marcha — `product/0002` (`diario`), `product/0003` (`coste`), `product/0004` (`estetica`) y `product/0005` (`viaje`) `consolidated`; `0006` y `0007` pendientes |
| Consolidar en `docs/estado/dominio.md` los doce anclajes **con su razonamiento** y la curva en S | En marcha — los de `diario`, `coste`, `estetica` y `viaje` ya están; el resto llega con cada eje |

Los siete artefactos pasaron el gate humano el 2026-08-05. Acto seguido se
actualizó el catálogo con lo que dos de ellos necesitaban para poder
implementarse con datos ciertos: la columna de batalla que `product/0005`
exige, las cinco filas de garantía equivocadas que `product/0007` habría
puntuado, la separación entre garantía incondicional y extensión condicionada,
el índice OCU con su fuente publicada, y la versión del CR-V, que sus 579 L de
maletero identifican como la HEV 4x4. **Ninguna spec está `implemented`:** no
hay todavía código de eje derivado de ellas.

**Los pesos no son tarea de nadie.** Son un control de la interfaz
—`WeightSliders`—: el usuario los mueve en vivo y ve el efecto. `DEFAULT_WEIGHTS`
es solo el punto de partida. Con escalas absolutas cada eje mueve lo que los
candidatos difieren en él, y eso es lo correcto: forzar influencia desde el
peso sería reintroducir a mano lo que el ADR 0004 quita.

## Fase 4 — Migración del artefacto

| Tarea | Estado |
| --- | --- |
| `product/0008` — el tipo de motor, visible en la comparativa | `approved` |
| Implementar, verificar y consolidar `product/0008` | Pendiente |
| Terminar de traer el artefacto React de un solo fichero | Pendiente — las fórmulas ya están en `src/domain/` desde `product/0001`; queda la interfaz |
| Página que explique cómo se calcula todo | Pendiente — sin spec |
| Diseño responsive real | Pendiente — sin spec; hoy está pensado para 560 px de ancho máximo |
| Persistencia en `localStorage` y configuración compartida por URL | Pendiente — sin spec |

`product/0008` vive aquí y no en la fase 3 porque es presentacional: su propia
spec declara que no depende del ADR 0004 ni de que ningún eje haya migrado, y
puede implementarse antes o después.

**La página que explica los cálculos depende de la fase 3.** Hoy el desglose
por eje responde «de dónde sale este número» coche a coche, pero no hay ningún
sitio que explique el modelo entero de una vez: qué mide cada eje, de dónde
sale cada anclaje, qué significan los pesos y qué supuestos entran en el
coste. Es contenido distinto del desglose, no un resumen de él — y escribirlo
antes de que los ejes sean los definitivos sería documentar un modelo que va a
cambiar. Con escalas absolutas gana importancia: la escala es justo lo que
hace la nota interpretable.

## Más adelante

No pertenece a ninguna fase: es alcance nuevo, no trabajo pendiente de una
fase abierta. Se lista para no perderlo, no para bloquear nada.

- **Eje de autonomía y repostaje.** Es la mayor diferencia práctica entre los
  once candidatos en un viaje largo —los térmicos e híbridos hacen 640-950 km
  con un depósito, los eléctricos la mitad en autopista— y el modelo es hoy
  ciego a ella. Queda fuera de `product/0005` a propósito: meter eléctricos y
  térmicos en una misma escala de alcance mezcla cosas distintas, porque lo
  que molesta no es solo el alcance sino el tiempo de repostaje. Necesita
  spec propia y datos que el catálogo no trae.
- **Eje subjetivo de conducción, tras probar los coches.** Es donde vuelve el
  juicio de primera mano que `product/0005` retira de `viaje`: butacas, ruido,
  suspensión — lo que una ficha técnica no recoge. No depende del proyecto
  sino de conducir los candidatos, y por eso no puede ser tarea de una fase.

## Proceso

El proceso —`docs/proceso/` y los ADR que lo gobiernan— no es entregable de
ninguna fase, pero sí es trabajo del proyecto y tiene estado. Vive aquí para
que no acabe archivado en la fase que resulte estar abierta.

| Tarea | Estado |
| --- | --- |
| ADR 0005 — los ADR son documentos de estado, no deltas | `approved` |
| Cambiar la regla de corrección en `docs/proceso/adrs.md` | Hecha |
| Añadir `Historial` a `docs/decisions/TEMPLATE.md` y exigirlo en el validador | Hecha — condición de error 16, ahora cinco secciones |
| Convertir los cuatro addenda vigentes al nuevo formato | Hecha — 0001, 0002, 0003 y 0004 |
| Escribir el método de calibración de escalas | Hecha — `docs/proceso/calibracion-de-escalas.md` |
| Registrar la invariante entre ejes en el ADR 0004 | Hecha |
| Registrar los dos tests que no se escriben, y cuatro anti-patrones nuevos | Hecha — `ci-y-guardarrailes.md` §8, anti-patrones 11-14 |
| Exigir que la consolidación se lleve el porqué, no solo el qué | Hecha — `consolidacion.md` §1 |

## Deudas abiertas

Toda deuda conocida se escribe. Una deuda no registrada no es una deuda: es
una sorpresa esperando fecha.

| Deuda | Detectada | Condición de cierre |
| --- | --- | --- |
| Acciones de GitHub fijadas por etiqueta de major, no por digest; TruffleHog va en `@main` | 2026-08-01 | Fijar cada acción a un SHA y dejar que Dependabot las actualice |
| Dos áreas de estado sin doc (modelo de datos, observabilidad); `interfaz` ya existe desde `product/0001` | 2026-08-01 | Que una spec las declare como *Doc de estado*; catálogo en `docs/proceso/consolidacion.md` §4 |
| Precios del catálogo de julio de 2026. Vigentes hoy —quince días— y no bloquean nada; `product/0003` los puntúa contra una escala absoluta, así que envejecen peor que antes | 2026-08-02 | Reconfirmar precios contra fuente vigente cuando pasen meses, y actualizar `cars.json` |
| **Disparador cumplido:** los gates de CD (smoke tests, canary) se aplazaban hasta que existiera despliegue real; ya existe (GitHub Pages, verde desde `technical/0001`) | 2026-08-03 | Definir smoke test post-deploy en una spec técnica, o registrar por qué se sigue aplazando |
| `ui/` sigue fuera del suelo de cobertura del 100%. Desde `technical/0002` sí tiene tests, pero solo de los fallos que aquella spec corrigió, y sin interacción: `renderToStaticMarkup` no hace clic ni arrastra, así que lo interactivo se sigue comprobando a mano | 2026-08-03 | Decidir si entra en el suelo de `vite.config.ts`, y si hacen falta jsdom o *testing library* para cubrir la interacción |
| Fila de referencia del Alfa Romeo Giulietta de la especificación original no está en `cars.json`: `product/0001` no la pedía y queda fuera a propósito, no por olvido | 2026-08-03 | Que una spec futura la pida explícitamente como referencia, o se cierre esta fila descartándola |
| La puntuación de todos los ejes es relativa al conjunto de candidatos: la nota dice en qué puesto va un coche, no si el coche es bueno. Amplifica diferencias irrelevantes —64 mm de anchura estirados a toda la escala—, esconde que los once son parecidos, y entierra al candidato equilibrado. En `diario` además invierte los pesos declarados: 0,6/0,4 acaba siendo 19%/81% | 2026-08-04 | ADR 0004 fija el principio; una spec por eje con sus anclajes. Los seis están escritos y `approved` (`product/0002`…`0007`); la deuda cierra cuando estén implementados y consolidados |
| Los datos numéricos del catálogo no declaran cota: un precio o una dimensión negativos validan sin error, justo lo que el ADR 0003 citaba como motivo para elegir Zod. Fuera de alcance de `technical/0002` a propósito: son dieciocho campos con cotas distintas, no una regla global | 2026-08-03 | Decidir la cota de cada campo y declararla en `CarSchema`, con test por campo acotado |
| `product/0003` quitó `anios`, y con él la fórmula de valor residual —`precio × res^(años/5)`— que dependía de ese horizonte: `coste` ya no la calcula. No molesta porque «pienso venderlo» está desactivado por defecto y la reventa está fuera de alcance, pero `pensandoVender` y `residualPct5y` quedan declarados sin ningún eje que los use | 2026-08-04 | Que alguien quiera analizar la reventa: entonces, spec propia que decida con qué horizonte se calcula, y si `pensandoVender`/`residualPct5y` se retiran o se reconectan |
| `index.html` no declara icono, así que el navegador pide `/favicon.ico` en cada carga y se lleva un 404. Cosmético y preexistente desde `technical/0001` | 2026-08-03 | Añadir un icono, o declarar explícitamente que no se quiere |
| La aceleración 0-100 del Corolla Cross 140H sigue sin verificar: motor.es publica la del 200H (197 CV, 8,1 s), que las notas del catálogo descartan por maletero, pero no da prestaciones del 140H. El catálogo mantiene 11,1 s estimados, y con escala absoluta (`product/0006`) el error va directo a la nota | 2026-08-05 | Encontrar la cifra en fuente publicada, o declarar el dato como estimado en la interfaz |
| El índice de fiabilidad de la OCU es **por marca, no por modelo**: 39 marcas sobre 392 modelos analizados. El eje `fiabilidad` puntúa la marca y lo presenta como fiabilidad del coche. No lo arregla ninguna escala | 2026-08-05 | Que exista un índice por modelo publicado, o declarar la limitación en la interfaz |
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
