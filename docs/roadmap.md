# Roadmap y deuda

> Este documento es la **fuente de verdad del estado del proyecto**: fases,
> tareas y deudas abiertas. `CLAUDE.md` resume y no duplica: al cerrar una
> fase se actualiza este documento, no el índice.

**Última actualización:** 2026-08-12

## Fases

| Fase | Objetivo | Estado |
| --- | --- | --- |
| 0 — Base documental | Contrato instanciado, estructura de docs y specs, ADRs semilla, CI de gates documentales | Cerrada |
| 1 — Decisión de stack | Lenguaje, framework, gestor de dependencias, despliegue; gates de código en CI | Cerrada |
| 2 — Andamiaje y dominio | Proyecto construible y explicabilidad de la puntuación | Cerrada |
| 3 — Puntuación en escala absoluta | Que la nota diga si un coche es bueno, no en qué puesto va de once | Cerrada |
| 4 — Migración del artefacto | Traer el comparador React existente y su diseño responsive | Pendiente |
| 5 — Rediseño y ficha única | Que la aplicación se lea como un producto y no como el artefacto, y que las dos fichas sean una | Pendiente |

Ninguna fase se da por cerrada mientras tenga tareas abiertas en la tabla de
abajo. Las tres primeras ya no tienen ninguna; la deuda que dejaron vive en
*Deudas abiertas*, que no pertenece a ninguna fase.

**La fase 5 es alcance nuevo, no trabajo pendiente de la 4.** El objetivo de
la fase 4 es *traer* el artefacto, y eso incluye traer sus carencias: el
artefacto no tiene un solo `:hover`, ni jerarquía entre marca y vista, ni una
fuente elegida. Mejorarlo por encima de lo que era no cabe en «migración», y
meterlo ahí dejaría la fase 4 sin criterio para cerrarse nunca. La fase 5 sí
toca una entrega de la 4 —`product/0013`, que `product/0018` sustituye—, y esa
dependencia queda anotada en la tabla de la fase 4.

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
| `product/0002` — el eje de uso diario, en escala absoluta | `consolidated` |
| `product/0003` — el eje de coste, en dos escalas absolutas | `consolidated` |
| `product/0004` — el eje de estética, sin normalización | `consolidated` |
| `product/0005` — el eje de viaje, objetivado en dos escalas absolutas | `consolidated` |
| `product/0006` — el eje de prestaciones, en dos escalas absolutas | `consolidated` |
| `product/0007` — el eje de fiabilidad, en dos escalas absolutas | `consolidated` — cierra los seis ejes |
| Gate humano: aprobar el ADR y las seis specs de eje | Hecha — 2026-08-05, en commit propio sin implementación |
| Actualizar el catálogo con lo que las specs exigen | Hecha — batalla, garantía, índice OCU y versión del CR-V |
| Implementar, verificar y consolidar los seis ejes | Hecha |
| Consolidar en `docs/estado/dominio.md` los doce anclajes **con su razonamiento** y la curva en S | Hecha |

Los siete artefactos pasaron el gate humano el 2026-08-05. Acto seguido se
actualizó el catálogo con lo que dos de ellos necesitaban para poder
implementarse con datos ciertos: la columna de batalla que `product/0005`
exige, las cinco filas de garantía equivocadas que `product/0007` habría
puntuado, la separación entre garantía incondicional y extensión condicionada,
el índice OCU con su fuente publicada, y la versión del CR-V, que sus 579 L de
maletero identifican como la HEV 4x4. Los seis ejes recorrieron el ciclo
completo —`implemented → verified → consolidated`— el 2026-08-06, cada uno
en su propia rama y PR, apiladas en orden porque comparten andamiaje
(`scoreOnAbsoluteScale`, el campo `scale` del desglose). **Fase 3 cerrada.**

**Los pesos no son tarea de nadie.** Son un control de la interfaz
—`WeightSliders`—: el usuario los mueve en vivo y ve el efecto. `DEFAULT_WEIGHTS`
es solo el punto de partida. Con escalas absolutas cada eje mueve lo que los
candidatos difieren en él, y eso es lo correcto: forzar influencia desde el
peso sería reintroducir a mano lo que el ADR 0004 quita.

## Fase 4 — Migración del artefacto

| Tarea | Estado |
| --- | --- |
| ADR 0006 — los estilos de la interfaz: CSS propio con tokens | `approved` |
| ADR 0007 — el reparto de áreas de estado de este proyecto | `approved` |
| `product/0008` — el tipo de motor, visible en la comparativa | `consolidated` |
| `technical/0004` — fundamento de estilos: tokens y primitivos | `consolidated` |
| `product/0009` — la comparativa se lee de un vistazo | `consolidated` |
| `product/0010` — diseño responsive real | `consolidated` |
| `product/0011` — la página que explica cómo se calcula todo | `consolidated` |
| `product/0012` — configuración persistente y compartible | `consolidated` |
| `product/0013` — la ficha técnica comparada | `superseded` por `product/0018` |
| `product/0014` — la ficha del modelo y sus fotos | `implemented` — un criterio de aceptación no se puede cumplir tal como está escrito (ver deudas abiertas); el resto, verificado |
| Cerrar las decisiones abiertas de las seis specs | Hecha — las cinco de producto por decisión propia, y las dos de doc de estado por el ADR 0007, que las contesta a la vez |
| Gate humano: aprobar los ADR 0006 y 0007 y las seis specs | Hecha — 2026-08-06, en commit propio sin implementación |
| Cerrar las cuatro decisiones abiertas de `product/0014` | Hecha — 2026-08-06, por decisión propia |
| Gate humano: aprobar `product/0014` | Hecha — 2026-08-06, en commit propio sin implementación |
| Implementar, verificar y consolidar `product/0008` | Hecha |
| Implementar, verificar y consolidar las siete specs nuevas | Cerrada — `technical/0004`, `product/0011`, `product/0013` (superseded) y las cinco anteriores, todas resueltas; `product/0014` es la única que se queda en `implemented`, por el motivo de arriba, no por falta de verificación |

`product/0008` vive aquí y no en la fase 3 porque es presentacional: su propia
spec declara que no depende del ADR 0004 ni de que ningún eje haya migrado, y
puede implementarse antes o después.

**Las cuatro tareas que la fase tenía sin spec ya la tienen.** «Terminar de
traer el artefacto» es `product/0009`, que lo plantea como lo que de verdad
falta —la jerarquía visual, no las fórmulas, que están en `src/domain/` desde
`product/0001`—; el responsive es `product/0010`; la página de explicación es
`product/0011`; la persistencia y el enlace compartible son `product/0012`.
`technical/0004` y el ADR 0006 son el andamiaje que las tres primeras
necesitan y que ninguna de ellas debía montar por su cuenta: hoy el proyecto
no tiene **ni una línea de CSS**, así que la primera hoja de estilos que se
escriba fija el modelo para todas las demás. Esa decisión se toma antes, en
un ADR, y no como residuo de la primera implementación que llegue.

**La fase tenía una quinta tarea que nadie había registrado.** El fuente del
artefacto, disponible desde el 2026-08-06, enseña que tiene **dos vistas**: la
clasificación —lo único migrado— y una **ficha técnica** comparada contra el
Alfa Romeo Giulietta, con columnas de diferencia y una métrica de litros de
maletero por metro cuadrado de huella. No estaba en este roadmap, ni en
`docs/estado/interfaz.md`, ni en ninguna spec. Es `product/0013`, y con ella
la fase deja de ser «traer el aspecto» para ser lo que siempre fue: traer
media aplicación.

**Orden de implementación dentro de la fase.** ADR 0006 → `technical/0004` →
`product/0009` → `product/0010`. `product/0013` va después de `product/0010`,
y comparte con `product/0011` el mecanismo de navegación por fragmento de URL,
así que la primera de las dos que se implemente lo monta y la otra lo
reutiliza. `product/0012` es ortogonal y cabe en cualquier hueco, y
`product/0008` no depende de ninguna.

**La fase 3 ya no bloquea a `product/0011`.** Se cerró el 2026-08-06, con los
doce anclajes y la curva en S consolidados en `docs/estado/dominio.md`. La
única dependencia dura que tenía la página de explicación está satisfecha, y
el orden de arriba pasa a ser de conveniencia —verse como el resto de la
aplicación— y no de bloqueo.

**El artefacto de referencia está transcrito, no enlazado.** El fuente vive
fuera del repositorio y no se puede consultar desde aquí, así que su sistema
de diseño —la paleta de siete papeles, las cifras en monoespaciada, los
primitivos y la composición de la fila del ranking— está transcrito en la
sección *El artefacto de referencia* de `product/0009`. Una referencia que no
se puede abrir no es una referencia. Lo que el artefacto **no** aporta es
diseño responsive: no tiene una sola media query, y su columna de 560 px es el
punto de partida de `product/0010`, no su respuesta.

**Por qué la página que explica los cálculos importa más ahora.** El desglose
por eje responde «de dónde sale este número» coche a coche, pero no hay ningún
sitio que explique el modelo entero de una vez: qué mide cada eje, de dónde
sale cada anclaje, qué significan los pesos y qué supuestos entran en el
coste. Es contenido distinto del desglose, no un resumen de él. Con las
escalas absolutas ya en producción, una nota pretende significar algo por sí
misma —«este coche es bueno en esto»—, y eso solo es interpretable si la
escala se puede consultar. La escala es justo lo que hace la nota legible, y
hoy no está en ninguna parte de la aplicación.

**Una séptima tarea se sumó el 2026-08-06, ya con la fase en marcha.**
`product/0013` había dejado dicho que «la ficha» no estaba declarada en
ningún sitio: la tabla comparada enseña cinco de las dieciocho magnitudes del
catálogo, y la aplicación no tenía ni una imagen. `product/0014` responde a
eso: declara la ficha completa por bloques y añade una tercera vista —una
columna por modelo, fila por característica, con la columna de nombres y la
del modelo elegido como comparación fijas a la izquierda, y la foto de cada
modelo como cabecera de su columna—. Las fotos se enlazan por URL absoluta,
sin copiarlas al repositorio. Recorrió las cuatro fases de gate y
`draft → approved → implemented` en la misma sesión de trabajo, con la CI
entera verde en local y cobertura al 100 %.

## Fase 5 — Rediseño y ficha única

| Tarea | Estado |
| --- | --- |
| ADR 0008 — una tipografía propia, servida desde el repositorio | `approved` |
| `technical/0005` — refuerzo del sistema visual: jerarquía, estados y shell | `consolidated` |
| `product/0018` — una sola ficha, con diferencias contra el modelo elegido | `consolidated` |
| Gate humano: aprobar el ADR 0008 y las dos specs, y marcar `product/0013` como `superseded` | Hecha — 2026-08-08, en commit propio sin implementación |
| Implementar y verificar las dos specs | Hecha — CI entera en verde en local, cobertura 100 % en `domain/`+`data/`+`logging/`, verificación manual en navegador a 320/592/960/1440px, despliegue real confirmado tras el merge de PR #57 |
| Consolidar `docs/estado/interfaz.md` y `dominio.md`, y las specs (`technical/0005`, `product/0018`, `technical/0004`, `product/0011`) | Hecha — 2026-08-12. `product/0014` se queda fuera: sigue `implemented`, no `verified` (ver deudas abiertas), pero su comportamiento vigente —fotos, columna fijada, diálogo— ya se lee en `docs/estado/interfaz.md` y `dominio.md`, escrito como parte de esta misma consolidación porque `product/0018` la enmienda sin sustituirla |
| `product/0019` — la portada enseña el coche | Sin redactar |

**Qué motiva la fase.** Dos cosas independientes que se hacen juntas porque
tocan los mismos ficheros:

1. **La aplicación se ve como lo que es, una traducción literal del
   artefacto.** No hay ni un `:hover` ni un `:active` en los dieciséis
   ficheros CSS del repositorio; las cuatro páginas abren con el mismo `<h1>`
   a 30 px, de modo que el elemento más grande de cada pantalla nunca dice
   dónde estás; esa cabecera está copiada literalmente en tres componentes con
   sus clases duplicadas en tres módulos; el cuerpo de las dos tablas va a
   11 px; y la familia tipográfica la elige el sistema operativo de quien
   mira. El ADR 0006 ya señaló las tres carencias del artefacto —foco,
   `:hover` y media queries— y arregló dos.
2. **Hay dos vistas que son la misma vista.** Las seis magnitudes de
   `#/ficha-tecnica` son un subconjunto exacto de las veinte de
   `#/ficha-completa`, y sus dos módulos de dominio ya están acoplados. Lo
   único que la técnica tiene y la completa no es la Δ; lo único que la
   completa tiene y la técnica no es, entre otras cosas, el mecanismo que esa
   Δ necesitaría para dejar de estar clavada contra la Giulietta: la columna
   fijada ya es «el modelo contra el que comparo», pero luego no resta.

**Orden de implementación.** ADR 0008 → `technical/0005` → `product/0018`.
No es de conveniencia: la escala tipográfica depende de la altura de x de la
familia que la pinta, y la ficha unificada consume el shell, el primitivo de
tabla y los papeles de dirección que `technical/0005` declara. Al revés habría
que escribir dos veces la cabecera que aquélla elimina.

**`product/0019` no está redactada a propósito.** Enseñar la foto del coche en
la tarjeta del líder y en la fila desplegada es la mayor ganancia de «producto
acabado» por unidad de trabajo, y reutiliza `photoSrc` y el degradado a hueco
que `product/0014` ya tiene. Pero **cambia qué información muestra la
portada**, así que es producto y no cabe en `technical/0005`. Se separa para
que no bloquee al resto.

**Lo que esta fase no toca:** la paleta —los siete papeles de `product/0009`
conservan su valor—, el esquema oscuro —sigue aplazado por el ADR 0006 con su
disparador—, la puntuación, y los datos del catálogo.

## Más adelante

No pertenece a ninguna fase: es alcance nuevo, no trabajo pendiente de una
fase abierta. Se lista para no perderlo, no para bloquear nada.

- **Despublicar y republicar un modelo — `product/0015`, `implemented`.**
  Hasta ahora la única forma de sacar un coche de la comparativa era borrar
  su entrada del catálogo, perdiendo las fuentes y las fotos que costó
  reunir. La spec añade un campo `published` a `Car` (por defecto `true`,
  así que ningún coche del catálogo actual cambió de estado al añadirlo),
  un punto único en el dominio —`publishedCars()` en `src/domain/car.ts`—
  que separa «todos los coches del fichero» de «los candidatos activos
  hoy» y que `src/ui/App.tsx` aplica antes de repartir el catálogo a
  cualquier vista, y dos skills de Claude Code —`unpublish-model` y
  `republish-model`— que activan o desactivan el campo dejando una nota
  fechada del motivo. No borra nada nunca, y no toca cómo se puntúa un
  coche publicado (el ADR 0004 ya hace que la nota de uno no dependa de qué
  otros estén hoy en la lista). Recorrió `draft → approved → implemented`
  en la misma sesión de trabajo, con la CI entera verde en local y
  cobertura al 100 %. Queda pendiente ejecutar de verdad una de las dos
  skills sobre un coche real del catálogo, como primera verificación fuera
  de los tests.
- **De dónde pueden salir las fotos — `product/0016`, en `draft`.** Tras dos
  tandas de búsqueda faltan trece de las sesenta vistas, y **diez son de
  maletero**: Wikimedia Commons es fotografía de aficionado en salones, donde
  nadie abre el portón, y el hueco no se cierra insistiendo en esa fuente. La
  spec declara qué orígenes son aceptables —sala de prensa del fabricante
  primero, Commons después, configurador oficial como último recurso—, qué se
  escribe en `credit` cuando la fuente no publica licencia con nombre, y qué
  hacer con lo que se rompe al salir de Commons (bloqueo por `Referer`,
  enlaces que caducan). **No reabre** la decisión de enlazar en vez de copiar:
  la refuerza, porque es lo que sostiene el resto. Sus dos decisiones abiertas
  se cerraron el 2026-08-07: **sí entran** importadores y concesionarios
  oficiales —los últimos, y con el crédito nombrando a cuál—, y **sí vale**
  una unidad de otro acabado o motorización **solo en maletero e interior**,
  declarándolo en `shows`. Recorrió `draft → approved → implemented` el
  2026-08-07: enmendó `product/0014` y reescribió la guía de fotos de la skill
  `add-model`. **Queda usarla**: los diez maleteros que faltan siguen ahí, y
  cerrarlos es ya trabajo de datos, no de proceso.
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
| ADR 0007 — el reparto de áreas de estado de este proyecto | `draft` |
| Apuntar `docs/proceso/consolidacion.md` §4 al ADR 0007 en vez de repetir la tabla | Hecha — y §4 pasa a mandar sobre *cuándo* se crea un doc, no sobre cuáles hay |
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
| **Reducida a una área:** queda `observabilidad` sin doc. El «modelo de datos» deja de estar pendiente — el ADR 0007 fija que en este proyecto lo cubre `docs/estado/dominio.md`, donde el catálogo ya está descrito, y que `docs/estado/datos.md` no se crea | 2026-08-01 | Que una spec declare `docs/estado/observabilidad.md` como *Doc de estado*; reparto vigente en el ADR 0007 |
| Precios del catálogo de julio de 2026. Vigentes hoy —quince días— y no bloquean nada; `product/0003` los puntúa contra una escala absoluta, así que envejecen peor que antes | 2026-08-02 | Reconfirmar precios contra fuente vigente cuando pasen meses, y actualizar `cars.json` |
| **Disparador cumplido:** los gates de CD (smoke tests, canary) se aplazaban hasta que existiera despliegue real; ya existe (GitHub Pages, verde desde `technical/0001`) | 2026-08-03 | Definir smoke test post-deploy en una spec técnica, o registrar por qué se sigue aplazando |
| `ui/` sigue fuera del suelo de cobertura del 100%. Desde `technical/0002` sí tiene tests, pero solo de los fallos que aquella spec corrigió, y sin interacción: `renderToStaticMarkup` no hace clic ni arrastra, así que lo interactivo se sigue comprobando a mano. **La fase 4 la ensancha:** el ADR 0006 mete CSS, que `renderToStaticMarkup` no calcula, así que contraste, foco y responsive se verifican a mano por diseño, no por dejadez | 2026-08-03 | Decidir si entra en el suelo de `vite.config.ts`, y si hacen falta jsdom o *testing library* para cubrir la interacción |
| Fila de referencia del Alfa Romeo Giulietta de la especificación original no está en `cars.json`: `product/0001` no la pedía y queda fuera a propósito, no por olvido. **Disparador cumplido:** `product/0013` la pide explícitamente, y sin ella su tabla de diferencias no tiene contra qué medir | 2026-08-03 | Que una spec futura la pida explícitamente como referencia, o se cierre esta fila descartándola. Cierra cuando `product/0013` esté consolidada |
| Los datos numéricos del catálogo no declaran cota: un precio o una dimensión negativos validan sin error, justo lo que el ADR 0003 citaba como motivo para elegir Zod. Fuera de alcance de `technical/0002` a propósito: son dieciocho campos con cotas distintas, no una regla global | 2026-08-03 | Decidir la cota de cada campo y declararla en `CarSchema`, con test por campo acotado |
| `product/0003` quitó `anios`, y con él la fórmula de valor residual —`precio × res^(años/5)`— que dependía de ese horizonte: `coste` ya no la calcula. No molesta porque «pienso venderlo» está desactivado por defecto y la reventa está fuera de alcance, pero `pensandoVender` y `residualPct5y` quedan declarados sin ningún eje que los use | 2026-08-04 | Que alguien quiera analizar la reventa: entonces, spec propia que decida con qué horizonte se calcula, y si `pensandoVender`/`residualPct5y` se retiran o se reconectan |
| `index.html` no declara icono, así que el navegador pide `/favicon.ico` en cada carga y se lleva un 404. Cosmético y preexistente desde `technical/0001` | 2026-08-03 | Añadir un icono, o declarar explícitamente que no se quiere |
| La aceleración 0-100 del Corolla Cross 140H sigue sin verificar: motor.es publica la del 200H (197 CV, 8,1 s), que las notas del catálogo descartan por maletero, pero no da prestaciones del 140H. El catálogo mantiene 11,1 s estimados, y con escala absoluta (`product/0006`) el error va directo a la nota | 2026-08-05 | Encontrar la cifra en fuente publicada, o declarar el dato como estimado en la interfaz |
| El andamiaje de los seis ejes está copiado casi literal (mapear candidatos, puntuar cada magnitud con `scoreOnAbsoluteScale`, acotar a 0-10, construir el `Map`): un cambio en la invariante común exige seis ediciones en paralelo sin que nada las obligue a coincidir. `normalizeAll` (`normalize.ts`) ya no lo llama ningún eje —los seis migraron a escala absoluta—, y sigue en el árbol sin más uso que su propio test | 2026-08-03 | Extraer el andamiaje común a un helper en `breakdown.ts`, o registrar por qué se prefiere la repetición. Decidir si `normalizeAll` se retira o se conserva para un eje futuro que vuelva a necesitar normalización relativa |
| `product/0014` tiene **49 de las 60 fotos posibles** (`check:photos` en verde). El **interior está completo** en los doce, y `toyota-corolla-cross`, `mazda-cx-5` y `hyundai-kona-electrico` tienen las cinco. Faltan **maletero** en nueve (`kia-ev3`, `hyundai-kona-hev`, `bmw-x1-xdrive25e`, `alfa-romeo-tonale`, `kia-sportage-hev`, `honda-civic-e-hev`, `lexus-nx-350h`, `honda-cr-v-e-hev`, referencia `alfa-romeo-giulietta`) y **lateral** en `honda-civic-e-hev` y `lexus-nx-350h`. La primera tanda bajo `product/0016` confirmó que las salas de prensa **sí publican maletero** —el Kona Eléctrico salió entero de Hyundai Newsroom—, pero el acceso desde este entorno es desigual: Hyundai sirve las URLs en el HTML; Kia y Honda montan la galería con JavaScript y el navegador sin salida externa no puede renderizarla; Stellantis responde 403; Lexus Europa no resuelve | 2026-08-06, revisada el 2026-08-07 | Cerrar las once que faltan. El cuello de botella ya no es la licencia sino el acceso: hace falta o bien un navegador con salida a internet, o bien ir por los importadores/concesionarios (origen 4), que sirven HTML estático |
| **Cerrada.** El despliegue real en GitHub Pages bloqueaba `verified` en `technical/0004`, `product/0011`, `technical/0005` y `product/0018` (`docs/proceso/ciclo-de-spec.md` §5: «no existe verificado con salvedades»). Confirmado tras el merge de PR #57 a `main`: la URL pública sirve los mismos hashes de asset que produce `npm run build`, todos en `200`. Las cuatro pasaron a `verified` y se consolidaron en la misma pasada | 2026-08-06, cerrada 2026-08-12 | Ninguna — cerrada |
| `product/0014` se queda en `implemented`, no `verified`: su criterio «a 320px se leen enteras dos columnas de modelo» **no se puede cumplir tal como está escrito** con los anchos vigentes —columna de modelo a `11rem` (176px) más la fijada, 352,75px, no caben en los 288px útiles que deja el relleno de página a 320px de viewport—, una cuenta que nadie había hecho con números reales mientras el criterio esperaba «revisión visual». No es una regresión de la fase 5: la corrección que sí trajo esa fase (`scroll-padding-left`, ver commit `c505880`) evita que la columna adyacente quede completamente tapada por la fijada, pero no la hace caber entera. El resto de sus criterios ya está verificado | 2026-08-12 | Decidir: angostar la columna de modelo por debajo de `11rem` a este ancho, o reducir el relleno de página en la ficha, o reescribir el criterio para que pida lo que sí se puede cumplir (columna adyacente parcialmente visible, nunca del todo tapada). Cualquiera de las tres, en una spec propia — no es una corrección de spec histórica |
| Alta de `volkswagen-id4`: falta la foto de **maletero** (`check:photos` en verde con 4 de las 5 vistas) — Wikimedia Commons no tiene una vista con el portón abierto para este modelo | 2026-08-08 | Encontrar la foto en un concesionario o importador oficial español (origen 4 de `photo-sourcing.md`) |
| Alta de `volkswagen-id4`: tres magnitudes estimadas sin fuente firme para el mercado español — **altura libre al suelo** (fuentes internacionales dispares, 116-210 mm), **mantenimiento anual** (proxy de la cuota del plan Volkswagen Long Drive, no un coste de revisión desglosado) y **valor residual a 5 años** (patrón general de depreciación de eléctricos, no una fuente específica del modelo) | 2026-08-08 | Encontrar una ficha oficial en español con altura libre al suelo; un coste de mantenimiento desglosado por revisión; una fuente de valor residual específica de España para el ID.4 |
| Alta de `kia-ev5`: faltan las fotos de **lateral** y **maletero** (`check:photos` en verde con 3 de las 5 vistas) — Wikimedia Commons no tiene un perfil cercano a 90º ni una vista con el portón abierto para este modelo | 2026-08-08 | Buscar en un concesionario o importador oficial español (origen 4 de `photo-sourcing.md`) |
| Alta de `kia-ev5`: **mantenimiento anual** (rango genérico de un eléctrico en España, no un coste de revisión desglosado del modelo) y **valor residual a 5 años** (comparación con otros eléctricos del catálogo, sin histórico real: el EV5 se lanzó en 2025) estimados sin fuente firme | 2026-08-08 | Encontrar un coste de mantenimiento desglosado por revisión; esperar a que el EV5 tenga histórico de mercado de segunda mano a 5 años |
| Alta de `hyundai-ioniq-5`: faltan las fotos de **lateral** y **maletero** (`check:photos` en verde con 3 de las 5 vistas), y las de **frontal**/**trasera** son del acabado Long Range Prestige (mercado coreano), no del Light que puntúa la ficha —mismo chasis NE1 y retoque 2024/2025, pero llantas y algún detalle de parachoques pueden no coincidir— | 2026-08-08 | Buscar lateral y maletero del Light en un concesionario o importador oficial español (origen 4 de `photo-sourcing.md`); sustituir frontal/trasera por el acabado Light si aparece |
| Alta de `hyundai-ioniq-5`: **mantenimiento anual** (rango genérico de un eléctrico en España, no desglosado por revisión) y **valor residual a 5 años** (dato de mercado de EEUU, iSeeCars, no de España) estimados sin fuente firme para el mercado español | 2026-08-08 | Encontrar un coste de mantenimiento desglosado por revisión; una fuente de valor residual española específica del modelo |
| Alta de `hyundai-tucson-hev`: faltan las fotos de **lateral** y **maletero** (`check:photos` en verde con 3 de las 5 vistas) — Wikimedia Commons no tiene un perfil cercano a 90º ni una vista con el portón abierto para este modelo; la frontal tiene además un ligero ángulo, no perfectamente recta | 2026-08-08 | Buscar en un concesionario o importador oficial español (origen 4 de `photo-sourcing.md`) |
| Alta de `hyundai-tucson-hev`: **mantenimiento anual** (media de revisiones oficiales M1/M2, no un coste anual desglosado del fabricante) y **valor residual a 5 años** (comparación con el Kia Sportage HEV del catálogo, no una fuente de reventa española del Tucson) estimados sin fuente firme | 2026-08-08 | Encontrar el coste de mantenimiento anual oficial del fabricante; una fuente de valor residual española específica del Tucson HEV |
| Alta de `hyundai-tucson-phev`: faltan las fotos de **lateral** y **maletero** (`check:photos` en verde con 3 de las 5 vistas), y las de **frontal**/**trasera** son del acabado N-Line (no del Klass que puntúa la ficha, aunque sí de la misma generación retocada 2024) — Wikimedia Commons no tiene un perfil cercano a 90º ni una vista con el portón abierto para este modelo | 2026-08-08 | Buscar en un concesionario o importador oficial español (origen 4 de `photo-sourcing.md`); sustituir frontal/trasera por el acabado Klass si aparece |
| Alta de `hyundai-tucson-phev`: **mantenimiento anual** (rango genérico de revisión de Hyundai, no desglosado) y **valor residual a 5 años** (comparación con el BMW X1 xDrive25e del catálogo, no una fuente de reventa española del Tucson PHEV) estimados sin fuente firme | 2026-08-08 | Encontrar el coste de mantenimiento anual oficial del fabricante; una fuente de valor residual española específica del Tucson PHEV |

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
