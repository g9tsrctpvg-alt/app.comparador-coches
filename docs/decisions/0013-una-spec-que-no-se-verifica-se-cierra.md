# 0013 — Una spec implementada que no se verifica se cierra, no se da por verificada

- **Estado:** draft
- **Fecha:** 2026-09-04
- **Nivel:** 🟡

## Contexto

`docs/proceso/ciclo-de-spec.md` §5 es tajante: «no existe *verificado con
salvedades*: o se cumplen los criterios o no se cumplen». La consecuencia es
correcta —impide que `verified` signifique «casi»— pero deja un camino sin
salida: una spec cuyo código lleva semanas en producción y a la que le queda
un criterio incumplido se queda en `implemented` **para siempre**.

Ese estado intermedio no informa a nadie. Su aviso A dice «no soy referencia
del estado actual, mira el doc de estado», y el doc de estado ya describe el
comportamiento vigente. Lo único que la spec sigue aportando es su lista de
criterios, con un `- [ ]` que nadie va a marcar. Mientras tanto la fase a la
que pertenece no puede cerrarse, y quien lee `specs/` no distingue una spec
estancada de una en curso.

Hoy hay dos casos, y **no son el mismo caso**:

- `product/0014` tenía un criterio que medía una composición —dos columnas de
  modelo a 320px— que `product/0023` retiró en agosto. No estaba incumplido:
  estaba obsoleto. El proceso ya tenía respuesta para eso, `superseded`, y es
  la que se le ha dado (2026-09-04).
- `technical/0006` tiene un criterio **genuinamente incumplido**: la cabecera
  necesita `overflow-x: auto` a 320px porque la marca y el `<select>` suman
  407px. Ninguna otra spec la sustituye, el comportamiento es el que se
  quería salvo en ese punto, y arreglarlo es un cambio de diseño —acortar la
  marca o esconderla a ese ancho— que nadie ha pedido.

Es el segundo caso el que el proceso no sabe terminar.

## Decisión

Se añade al ciclo de vida un **estado terminal `closed`**: la spec deja de
esperar una verificación que no va a ocurrir, **sin afirmar que sus criterios
se cumplieron**.

Cerrar una spec exige las cinco condiciones, todas:

1. Está en `implemented`. Nunca se cierra desde `draft` ni `approved`: sin
   código no hay nada que cerrar, hay algo que abandonar, y eso se borra.
2. Han pasado **21 días naturales o más** desde que pasó a `implemented` sin
   llegar a `verified`. En este proyecto el tramo `implemented → verified →
   consolidated` se recorre casi siempre el mismo día, así que tres semanas
   está un orden de magnitud por encima del ritmo real: no cierra nada que
   solo esté en curso.
3. El comportamiento vigente **se lee en el doc de estado** declarado. Si
   falta, se consolida primero lo que haya: cerrar dejando la verdad solo en
   el código es el anti-patrón 6.
4. **Cada criterio sin marcar tiene destino escrito**: una fila de deuda en
   `docs/roadmap.md`, o un aplazamiento con su disparador. Un criterio que se
   cierra sin destino es el anti-patrón 7 con otro nombre.
5. La transición la hace **una persona** 🔴, como `superseded`. Aceptar un
   criterio incumplido es un juicio de producto, no de contabilidad.

Lo que `closed` **no** hace:

- **No marca los criterios.** Los `- [ ]` se quedan sin marcar para siempre.
  Son el registro de qué no se cumplió, y borrarlo es perder la única señal
  que queda.
- **No dice que la spec sea correcta.** Dice que ya no gobierna nada: el
  comportamiento vive en el doc de estado y lo que falta vive en la deuda.
- **No abre la puerta a editarla.** Igual que una `consolidated`, una spec
  `closed` se congela: cualquier cambio posterior de ese comportamiento es
  una **spec nueva** (`docs/proceso/consolidacion.md` §3, que pasa a aplicar
  a los dos estados terminales).

## Alternativas consideradas

- **Dejarlas en `implemented` indefinidamente.** Es el estado actual y es el
  problema: dos specs que no dicen nada, dos fases que no cierran y ninguna
  forma de distinguir estancada de en curso. Se descarta porque no decidir
  también es una decisión, y ésta ya lleva tres semanas tomada por omisión.
- **Marcarlas `verified` pasado un plazo —«darlas por válidas»—.** Es la
  formulación más cómoda y la que se propuso primero. Se descarta porque
  pone en el registro una afirmación que hemos medido que es falsa: la
  cabecera **sí** se desplaza a 320px. El tiempo no convierte un criterio
  incumplido en cumplido, y `verified` dejaría de significar nada para todas
  las demás specs. Además destruye la señal: marcado el criterio, nadie sabe
  ya qué faltó.
- **Reescribir el criterio para que pida lo alcanzable.** Convierte el
  criterio en la descripción de lo que salió, que es exactamente lo que hace
  inútil a cualquier criterio de aceptación. Sobre una spec ya implementada
  es, además, aprobar retroactivamente.
- **Arreglar siempre lo que falte, como regla.** Obliga a trabajo de producto
  por una razón de contabilidad documental. Se descarta **como regla
  general** y se mantiene **como opción caso a caso**: cuando el criterio
  sigue siendo lo que se quiere, lo que toca es cumplirlo, y esa vía no la
  cierra este ADR.
- **Usar `superseded` para todo.** Solo es cierto cuando otra spec sustituye
  de verdad a la anterior —el caso de `product/0014`—. Aplicarlo cuando no
  existe esa spec es inventarse una sustitución para no admitir un
  incumplimiento.

## Consecuencias

- El ciclo de vida gana un final para las specs estancadas, y `verified`
  conserva intacto su significado: se cumplen los criterios o no.
- `docs/proceso/ciclo-de-spec.md` gana un estado en su tabla y una sección
  propia; `docs/proceso/consolidacion.md` §3 pasa a hablar de los dos estados
  terminales; `scripts/validateDocs.ts` acepta `closed` y exige su aviso.
- Se pierde una tensión útil: mientras una spec seguía en `implemented`,
  molestaba. Cerrarla la deja de molestar, y el riesgo es que `closed` se
  vuelva la salida cómoda. Lo contienen las cinco condiciones —en especial la
  del destino de cada criterio— y que la transición sea humana.
- **Aplazado:** la CI no comprueba que cada criterio sin marcar tenga destino
  escrito; es una lectura humana. *Disparador:* que se cierre una tercera
  spec y alguna deje un criterio sin destino registrado.

## Historial

- **2026-09-04 — creación.** Nace de revisar `product/0014` y
  `technical/0006`, las dos únicas specs estancadas en `implemented`, y de
  comprobar que solo una de las dos tenía respuesta en el proceso vigente.
