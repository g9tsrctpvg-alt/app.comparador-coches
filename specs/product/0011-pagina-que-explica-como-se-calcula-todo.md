# 0011 — La página que explica cómo se calcula todo

- **Id:** product/0011
- **Estado:** implemented
- **Tipo:** product
- **Fecha:** 2026-08-06
- **Specs relacionadas:** product/0001…0007, product/0009, technical/0004
- **ADRs relacionados:** 0004, 0006, 0007
- **Doc de estado:** `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

El comparador sabe responder «de dónde sale **este** número». `product/0001`
lo dejó resuelto: se despliega un coche, se abre un eje, y ahí están el dato
de entrada con su fuente, los supuestos aplicados, los pasos intermedios, la
normalización con sus extremos, las penalizaciones y la aportación al total.

Lo que no sabe responder es **«cómo funciona esto»**. No hay ningún sitio en
la aplicación donde se explique el modelo entero de una vez:

- Qué mide cada uno de los seis ejes, y por qué esos seis.
- Qué es un anclaje, cuáles son los doce que fijó la fase 3, y **por qué cada
  uno vale lo que vale**. Ese razonamiento vive en `docs/estado/dominio.md`,
  que es un documento del repositorio: quien usa el comparador no lo ve.
- Qué es la curva en S entre anclajes y por qué la escala no es una recta.
- Qué significa mover un peso, y qué **no** significa: con escalas absolutas,
  un eje pesa lo que los candidatos difieren en él.
- Qué supuestos globales entran en el coste, y con qué valores por defecto.
- Qué limitaciones conocidas tiene el modelo. Dos están registradas y
  ninguna es visible desde la aplicación: el índice de fiabilidad de la OCU
  es **por marca, no por modelo**, y la aceleración del Corolla Cross 140H
  es una estimación sin fuente publicada.

Es contenido **distinto** del desglose, no un resumen de él. El desglose es
vertical —un coche, un eje, sus números—; esto es horizontal: el modelo
completo, sin coche delante.

Y gana importancia justo ahora. Mientras la puntuación era relativa al
conjunto, la nota solo decía en qué puesto iba un coche entre once. Desde que
la fase 3 cerró —2026-08-06, los seis ejes en escala absoluta y consolidados—
un 7,2 pretende significar algo por sí mismo, «este coche es bueno en esto», y
eso **solo es interpretable si la escala se puede consultar**. La escala es lo
que hace la nota legible, y hoy la aplicación la aplica sin enseñarla en
ninguna parte.

## Objetivo

Que cualquiera pueda entender el modelo de puntuación entero sin salir de la
aplicación, sin abrir el repositorio y sin tener un coche delante.

## Alcance

- **Una sección propia de la aplicación**, alcanzable desde la comparativa y
  con vuelta a ella, dedicada a explicar el modelo.
- **Los seis ejes**, uno a uno: qué mide, con qué datos, qué fórmula y qué
  peso trae por defecto.
- **Los anclajes de cada eje, con su razonamiento**: los dos valores que
  fijan el 10 y el 0, y el porqué escrito de cada uno.
- **La curva en S**: qué es, por qué se usa entre anclajes y qué implica
  —que la nota apenas se mueve cerca de los extremos y mucho en el centro—.
  Con la excepción declarada: `estetica` no la usa, y por qué.
- **Los pesos**: qué son, cuál es el reparto por defecto, y la advertencia de
  que subir un peso no sube la nota de nadie si todos los candidatos empatan
  en ese eje.
- **Los supuestos globales**: cuáles son, qué valor traen por defecto, dónde
  se editan y en qué cálculos entran.
- **Las penalizaciones condicionales**, con su condición y su efecto.
- **Las limitaciones conocidas del modelo**, escritas sin adornos.
- **La procedencia**: que cada dato del catálogo lleva sus fuentes, qué
  significa que un dato esté marcado como estimado, y qué se hace cuando dos
  fuentes no coinciden.

## Fuera de alcance

- **Cambiar cualquier puntuación.** Esta spec explica el modelo; no lo toca.
- **Sustituir el desglose por coche.** Los dos conviven y responden a
  preguntas distintas. Ni el desglose remite a esta página para dar sus
  números, ni esta página enseña los números de ningún coche concreto.
- **Duplicar la documentación del repositorio.** Esta página no es una copia
  de `docs/estado/dominio.md` pegada en HTML: es el mismo contenido
  destinado a quien usa el comparador, no a quien lo desarrolla. Lo que sí es
  innegociable es que no se desincronicen — ver el requisito 3.
- **Un editor de anclajes.** Los anclajes **no son un supuesto global
  editable**: lo dice `docs/proceso/calibracion-de-escalas.md` §5. Aquí se
  leen, no se tocan.
- **Explicar los ejes que no existen.** El eje de autonomía y repostaje y el
  eje subjetivo de conducción están en el roadmap y no en el modelo; la
  página no los anticipa.
- **Cualquier dependencia nueva**, incluido un enrutador. Ver el requisito 1.
- **Internacionalización.** La página va en español, como el resto de la
  interfaz.
- **Posicionamiento en buscadores y renderizado previo.** Está aplazado con
  su disparador —que el comparador deje de ser de uso personal— y esta
  página no lo cumple.

## Requisitos / comportamiento esperado

1. **La sección se alcanza sin dependencia nueva.** La navegación es por
   fragmento de URL (`#/como-se-calcula` o equivalente), resuelta con el
   `hash` de `window.location`. No se añade un enrutador: sería una
   dependencia 🟡, y el fragmento tiene además la propiedad de funcionar bajo
   el subpath de GitHub Pages sin configuración de servidor, que es
   exactamente donde un enrutador de rutas reales daría 404 al recargar.
2. **Desde la comparativa se llega a la explicación y desde la explicación se
   vuelve**, con controles visibles en ambos sentidos. Un enlace que se abre
   y deja al usuario sin retorno no cumple.
3. **Lo que la página afirma sobre el cálculo procede de la misma declaración
   que gobierna el cálculo**, siempre que exista. Los nombres de los ejes,
   sus etiquetas, las descripciones de fórmula, los pesos por defecto, los
   supuestos por defecto y sus unidades se leen de `src/domain/scoring/`, no
   se reescriben a mano. Es la regla que `product/0001` ya impuso para la
   descripción de fórmula en el desglose, extendida a esta página.
4. **La prosa explicativa —el porqué— vive en un módulo de contenido
   TypeScript** dentro de `src/ui/`, separado de los componentes que lo
   renderizan. No es Markdown importado en tiempo de build ni se genera desde
   `docs/estado/dominio.md`: lo primero añade un paso de build para nada, y lo
   segundo ataría la interfaz al formato de un documento de proceso, que se
   edita con otras reglas y por otros motivos.
   Un anclaje se muestra, por tanto, con **su valor leído del dominio** —donde
   un test detecta la desincronización— y **su razonamiento escrito en el
   módulo de contenido**. Que el razonamiento esté también en
   `docs/estado/dominio.md`, en registro técnico, es duplicación consciente
   entre dos audiencias: ningún test puede comparar dos prosas, y por eso el
   criterio de los doce anclajes se verifica a mano, uno a uno.
5. **Cada eje tiene su bloque**, en el orden de `AXIS_ORDER`, con: qué mide,
   qué datos usa, sus anclajes con valor y razonamiento, la forma de su
   escala y su peso por defecto.
6. **Los doce anclajes de la fase 3 aparecen con su razonamiento completo.**
   No basta con la cifra: el razonamiento es la parte que impide que dentro
   de seis meses sean constantes sin origen.
7. **La curva en S se explica y se ve.** Además del texto, la página
   representa la forma de la curva —una gráfica sencilla, dibujada con lo que
   ya hay en el proyecto— para que se entienda que entre anclajes la nota no
   avanza de forma lineal.
8. **La excepción de `estetica` se declara explícitamente**: es el único eje
   sin curva en S, y la página dice por qué en vez de dejar que parezca un
   descuido.
9. **La página advierte de lo que un peso no hace.** Con escalas absolutas,
   subir el peso de un eje en el que los once candidatos empatan no cambia el
   orden. Es la consecuencia del ADR 0004 que más sorprende a quien mueve un
   deslizador esperando ver algo.
10. **Las limitaciones conocidas tienen su propio apartado**, con al menos
    las dos registradas hoy: la fiabilidad de la OCU es por marca y no por
    modelo, y la aceleración del Corolla Cross 140H es una estimación sin
    fuente publicada. Se escriben como limitaciones, no como notas al pie.
11. **La página es navegable**: encabezados jerárquicos correctos, un índice
    de sus apartados si tiene más de una pantalla de largo, y estructura
    semántica que permita saltar de sección con lector de pantalla.
12. **Ninguna puntuación cambia** por efecto de esta spec, y ningún módulo de
    `src/ui/` gana lógica de cálculo: la regla `ui-no-scoring-internals`
    sigue pasando sin modificar.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] Existe una sección de explicación alcanzable desde la comparativa, y
      desde ella se vuelve a la comparativa, con controles visibles en ambos
      sentidos. `App.tsx` enlaza a `#/como-se-calcula`; `ExplicacionPage`
      enlaza de vuelta a `#`. Comprobado con Playwright: ida y vuelta reales
      sobre `npm run preview`, y con test (`App.test.tsx`).
- [x] Recargar el navegador con el fragmento de la explicación en la URL
      **sobre el sitio desplegado en GitHub Pages** abre la explicación, no
      un 404 ni la comparativa. El hash nunca llega al servidor —GitHub
      Pages sirve siempre `index.html`, sin verlo—, así que no hay 404
      posible por construcción; comprobado el mecanismo equivalente contra
      `npm run preview` (otro servidor de estáticos ciego al fragmento):
      cargar directamente `.../#/como-se-calcula` abre la explicación.
      Pendiente de la comprobación final contra la URL pública, igual que
      `technical/0004`, tras el próximo despliegue.
- [x] `package.json` no tiene ninguna dependencia nueva respecto a la rama
      base. `git diff main -- package.json package-lock.json` no muestra
      cambios.
- [x] Los seis ejes tienen bloque, en el orden de `AXIS_ORDER`, y sus nombres
      y etiquetas se leen del dominio: renombrar la etiqueta de un eje en
      `src/domain/scoring/weights.ts` cambia el título de su bloque sin tocar
      la página. Hay un test que lo comprueba.
      `ExplicacionPage.test.tsx`, contra el `AXIS_LABELS` real.
- [x] Los pesos por defecto y los supuestos por defecto que la página muestra
      proceden de `DEFAULT_WEIGHTS` y `DEFAULT_ASSUMPTIONS`. Hay un test que
      falla si se cambia el valor en el dominio y la página sigue enseñando
      el anterior. `ExplicacionPage.test.tsx`, contra los valores reales.
- [x] Los doce anclajes aparecen con su valor **y su razonamiento**. Se
      comprueba uno a uno contra `docs/estado/dominio.md`, que es donde la
      fase 3 los consolida. Los diez de los cinco ejes con curva en S
      (diario, coste, viaje, prestaciones, fiabilidad) y los dos de estética
      (1 → 0, 5 → 10) se revisaron uno a uno contra las tablas de
      `dominio.md` y coinciden; el valor lo lee la página de `scoreCatalog`,
      nunca a mano.
- [x] La página representa gráficamente la curva en S, y el dibujo no
      introduce ninguna dependencia. `SCurveChart.tsx`: SVG con puntos
      precalculados como datos estáticos, sin librería de gráficos.
- [x] La página declara que `estetica` no usa curva en S y por qué.
- [x] La página contiene la advertencia sobre lo que un peso no hace cuando
      los candidatos empatan en un eje.
- [x] El apartado de limitaciones nombra la fiabilidad por marca y la
      aceleración estimada del Corolla Cross 140H.
- [x] La jerarquía de encabezados de la página no salta niveles, y hay un
      único `h1`. `ExplicacionPage.test.tsx` lo comprueba recorriendo todos
      los `h1`-`h6` del marcado.
- [x] La puntuación total de los once candidatos es idéntica antes y después
      del cambio, y `npm run arch:check` pasa sin modificar
      `.dependency-cruiser.mjs`. La página solo lee `scoreCatalog`, no lo
      envuelve ni lo modifica; `scoreCatalog.snapshot.test.ts` sigue en
      verde sin tocarse, y `.dependency-cruiser.mjs` no se ha modificado.
- [x] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local.

## Dependencias y supuestos

- **La dependencia de la fase 3 está satisfecha.** Era la única dura de esta
  spec —escribirla antes de que los ejes fueran los definitivos habría sido
  documentar un modelo a punto de cambiar—, y la fase cerró el 2026-08-06 con
  los doce anclajes, su razonamiento y la curva en S consolidados en
  `docs/estado/dominio.md`. El criterio de los doce anclajes se verifica
  contra ese documento, que ya los contiene.
- **Depende de `technical/0004` y `product/0009`** para verse como el resto
  de la aplicación. Podría implementarse antes y quedar sin estilo, pero
  entonces habría que estilarla dos veces.
- **El ADR 0007 fija que esta vista es interfaz**, no un área con doc propio:
  es una superficie de la aplicación, y el modelo que presenta ya tiene
  autoridad en `docs/estado/dominio.md`. Por eso el campo *Doc de estado*
  declara solo `interfaz.md`.
- Se asume que el contenido explicativo se escribe **en español**, como el
  resto de la interfaz, mientras los identificadores del dominio siguen en
  inglés.
- Se asume que la navegación por fragmento basta y que no hará falta un
  enrutador aunque aparezcan más secciones. Si algún día hacen falta rutas
  reales, es un ADR y una dependencia, no una ampliación de esta spec.
- Se asume que la parte de la página que se lee del dominio y la prosa que se
  escribe a mano se pueden mantener sincronizadas por convención más test, y
  no hace falta un generador. El requisito 3 y sus dos criterios son
  exactamente esa red de seguridad para los **valores**. Para el
  **razonamiento** no la hay, y el requisito 4 lo dice sin adornos: es
  verificación a mano, y su coste real es que mover un anclaje obliga a tocar
  dos sitios. Se acepta a cambio de no acoplar la interfaz a un doc de
  proceso. Si algún día los anclajes se mueven a menudo, deja de compensar.

## Decisiones abiertas

Ninguna.
