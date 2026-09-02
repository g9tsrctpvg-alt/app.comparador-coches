# 0036 — Quien elige dice qué eje decidió

- **Id:** product/0036
- **Estado:** consolidated
- **Tipo:** product
- **Fecha:** 2026-09-02
- **Specs relacionadas:** product/0029, product/0033, product/0035
- **ADRs relacionados:** 0004, 0011
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

> ⚠️ **Spec consolidada (2026-09-02).** Describe un cambio en el momento en
> que se redactó; su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy es histórica. Para el estado actual, ver
> `docs/estado/dominio.md` y `docs/estado/interfaz.md`. Vigentes aquí solo
> los **criterios de aceptación**, como registro de verificación.

## Contexto

`product/0035` deduce los siete pesos de una tanda de cara a cara. Al usarla
por primera vez sobre el despliegue real, el resultado no fue representativo:
partiendo de unos deslizadores en `carga 5 · habitabilidad 9 · diario 8 ·
prestaciones 7 · fiabilidad 6 · estética 6 · coste 6`, la tanda propuso
`0 · 0 · 0 · 10 · 2 · 5 · 2`. Tres ejes anulados y `prestaciones` disparada al
máximo, sobre un puñado de respuestas.

No es mala suerte ni ruido: es el criterio que la propia spec fijó, haciendo
exactamente lo que se le pidió. Hay dos defectos, los dos medidos el
2026-09-02 sobre treinta perfiles sintéticos y el catálogo real.

**El primero: se elige la explicación más extrema, no la más representativa.**
El requisito 5.1 de `product/0035` ordena escoger, entre las combinaciones
compatibles, la de **mayor margen mínimo** — la que gana los cara a cara
respondidos por más diferencia. Maximizar un margen sobre un conjunto que es
un cono lleva siempre a una **esquina**. Con pocas respuestas el conjunto
compatible es enorme y esa esquina es disparatada:

| Respuestas | Combinaciones compatibles | Ejes en 0 (hoy) | Acierto (hoy) |
| --- | --- | --- | --- |
| 3 | 16.004 | **4,50 de 7** | 0,715 |
| 5 | 4.020 | **3,48 de 7** | 0,786 |
| 8 | 499 | 2,48 de 7 | 0,858 |
| 12 | 31 | 1,23 de 7 | 0,937 |

Con tres respuestas, **cuatro ejes y medio de siete quedan clavados en cero de
media**. La interfaz invita a parar cuando quieras («Terminar ahora»), así que
esto no es un caso raro: es el caso normal de quien no llega al final.

**El segundo: el desempate que prometía respetar tus deslizadores no existe.**
El mismo requisito 5.1 dice que, a igualdad de margen, se elige la combinación
más cercana a los pesos vigentes. Medido: **ese desempate no llegó a
consultarse ni una sola vez en cuarenta sesiones**. El margen mínimo es una
cantidad continua y prácticamente nunca empata, así que el criterio 3 es letra
muerta y la promesa de «mueve lo menos posible lo que ya tenías» nunca se
cumple.

**Y debajo de los dos hay una carencia de fondo.** Una respuesta «prefiero A»
se convierte en **una sola desigualdad sobre los siete pesos a la vez**,
`Σ pesoᵢ × (notaᵢ(A) − notaᵢ(B)) > 0`. No dice **qué eje** decidió. El
algoritmo queda libre para repartir la explicación como quiera, y por eso
puede concluir que `prestaciones` vale 10 sin que nadie lo haya dicho. Quien
elige un coche normalmente **sí sabe** qué le hizo elegirlo, y hoy no hay
dónde decirlo: se le pide adivinar a la máquina algo que la persona podía
regalar.

## Objetivo

Que los pesos propuestos sean **representativos de lo respondido en vez de
extremos**, y que quien elige un coche pueda **decir qué ejes le hicieron
elegirlo**, para que la atribución la escriba quien decide y no la invente el
algoritmo.

## Alcance

Dos cambios independientes, en este orden. El primero vale por sí solo aunque
el segundo no llegue a implementarse.

- **Fase 1 — el representante.** Sustituir «mayor margen mínimo» por «la
  combinación compatible más cercana al centro del conjunto compatible», y
  retirar el desempate por cercanía a los deslizadores, que no se activa.
- **Fase 2 — la atribución.** Que cada elección pueda marcar **qué ejes
  fueron determinantes**, y que eso genere una desigualdad más.

## Fuera de alcance

- **Cómo se puntúa.** Ni un anclaje, ni una curva, ni una fórmula de eje. Esta
  spec **lee** las notas de eje que `scoreCatalog` ya produce.
- **La rejilla declarada** de 78.124 combinaciones, que no cambia (ADR 0011).
- **Preguntar por un eje suelto** («¿cuál prefieres en capacidad de carga?»).
  Se ha considerado y se descarta con motivo: la nota de un eje ya se calcula
  a partir de los datos del coche, así que preguntarla es pedir que se
  rededuzca un número que la aplicación ya tiene, y **no informa de ningún
  peso**. Serviría para calibrar la **escala** de un eje, que es un problema
  distinto —el de los ADR 0004 y 0010— y merecería su propia spec.
- **Qué se pregunta y cuándo termina la tanda** (`product/0035`, requisito 6):
  el par que más divide al comité y la parada por agotamiento siguen igual.
- **Las dos cifras de avance** y el conjunto sobre el que se calculan
  (requisito 9 de `product/0035`), que siguen igual.
- **Que la tanda sobreviva a una recarga**, que sigue fuera con su disparador.
- **`CONFIG_VERSION`**, que no sube: no se persiste nada nuevo.

## Requisitos / comportamiento esperado

### 1. El representante (fase 1)

1.1. Los **pesos propuestos** son la combinación del conjunto compatible más
cercana, en distancia euclídea, al **centro** de ese conjunto —la media,
componente a componente, de todas las combinaciones compatibles—. Empates, por
el orden de recorrido de la rejilla.

1.2. Se elige **una combinación del conjunto**, no el centro redondeado, para
conservar la garantía del requisito 5.3 de `product/0035`: los pesos
propuestos no contradicen ninguna respuesta coherente. El centro sin más puede
caer fuera del conjunto —medido: ocurre en 2 de 40 sesiones alrededor de la
respuesta doce—, y proponer unos pesos que contradicen lo que acabas de
contestar sería peor que el problema que esta spec arregla.

1.3. **Se retira el desempate por cercanía a los pesos vigentes.** No se
sustituye por otro: con el criterio nuevo tampoco se activaría casi nunca, y
mantener un criterio inerte es peor que no tenerlo, porque promete una
propiedad que el sistema no da. Lo que la propuesta garantiza es ser
representativa de **lo respondido**, no parecerse a lo que había antes.

1.4. Lo medido que sostiene 1.1, sobre treinta perfiles sintéticos:

| Respuestas | Ejes en 0 (hoy → nuevo) | Acierto (hoy → nuevo) |
| --- | --- | --- |
| 3 | 4,50 → **0,07** | 0,715 → **0,845** |
| 5 | 3,48 → **0,10** | 0,786 → **0,883** |
| 8 | 2,48 → **0,40** | 0,858 → **0,904** |
| 12 | 1,23 → **0,97** | 0,937 → **0,939** |

Mejor en las dos columnas y en los cuatro puntos de parada, y muy
especialmente donde más falla hoy: al parar pronto.

### 2. Qué es «determinante» (fase 2)

2.1. Al preferir un coche se pueden marcar **cuáles de los siete ejes hicieron
la elección**. Marcarlos es **opcional**: no marcar ninguno deja la respuesta
exactamente como hoy, una sola desigualdad.

2.2. Marcar un conjunto `S` de ejes añade **una segunda desigualdad**: sin esos
ejes, la decisión no sale.

```text
Σ pesoᵢ × Δᵢ  >  0        para los siete ejes   (como hoy)
Σ pesoᵢ × Δᵢ  ≤  0        para los ejes fuera de S
```

Es la lectura literal de «determinante»: el resto, por sí solo, no habría
elegido a ese coche. No se exige que los ejes marcados aplasten a los demás,
solo que sin ellos la elección se cae.

2.3. Marcar **los siete** ejes no aporta nada —el segundo sumatorio queda
vacío y la desigualdad se cumple siempre—, y es correcto que así sea: «lo
decidió todo junto» es exactamente no atribuir.

2.4. Las dos desigualdades de una respuesta cuentan **por separado** en el
recuento de contradicciones (`product/0035`, requisito 4.1). Una atribución
incoherente con el resto de la tanda se absorbe como cualquier otra respuesta
arrepentida, sin romper nada.

2.5. **«Me da igual» no admite atribución**: sin elección no hay nada que
atribuir.

2.6. Lo medido, sobre los mismos treinta perfiles, con la fase 1 ya aplicada:

| Respuestas | Acierto solo fase 1 | Acierto atribuyendo |
| --- | --- | --- |
| 3 | 0,845 | **0,887** |
| 5 | 0,883 | **0,919** |
| 8 | 0,904 | **0,936** |
| 12 | 0,939 | **0,966** |

Y la tanda se acorta: de **16,8 preguntas de media a 13,2**. Atribuir sale
gratis en tiempo, porque lo que cuesta marcar unos ejes se recupera en
preguntas que ya no hace falta hacer.

### 3. Cómo se marca en la interfaz (fase 2)

3.1. Al pulsar «Prefiero el X», el diálogo **no pasa a la pregunta
siguiente**: muestra los siete ejes con su icono y su color
(`technical/0011`) como marcas conmutables, bajo el rótulo de qué hizo elegir
ese coche.

3.2. Dos salidas: **«Siguiente»**, que registra los ejes marcados —ninguno si
no se marcó nada—, y **«No sabría decir»**, que registra la elección sin
atribución. Las dos avanzan a la pregunta siguiente.

3.3. **«Deshacer la última»** (requisito 8.2 de `product/0035`) retira la
respuesta entera, atribución incluida, y vuelve al cara a cara.

3.4. En este segundo paso **sigue sin verse ninguna cifra del modelo**
(requisito 7.2 de `product/0035`): los ejes se marcan por su nombre, sin nota,
sin porcentaje y sin desglose. Enseñar aquí cuánto aporta cada eje sería
decirle a quien contesta lo que la aplicación ya piensa, que es justo lo que
esa regla evita.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] Los pesos propuestos son siempre un elemento del conjunto compatible, y
      con respuestas coherentes no contradicen ninguna (requisito 1.2).
- [x] Con las mismas respuestas, dos derivaciones devuelven los siete pesos
      idénticos (determinismo, sin muestreo ni semilla).
- [x] Sobre treinta perfiles sintéticos y tres respuestas, la media de ejes en
      cero baja de 4,50 a **0,5 o menos**, y el acuerdo con la clasificación
      real sube de 0,715 a **0,82 como mínimo** (requisito 1.4).
- [x] Con cinco respuestas, el acuerdo sube de 0,786 a **0,86 como mínimo**.
- [x] Ninguna combinación del conjunto compatible está más cerca del centro
      que la propuesta (requisito 1.1).
- [x] Marcar los siete ejes da exactamente el mismo conjunto compatible que no
      marcar ninguno (requisito 2.3).
- [x] Marcar un subconjunto propio reduce el conjunto compatible o lo deja
      igual, nunca lo agranda, cuando la atribución es coherente.
- [x] Una atribución imposible —marcar un eje en el que el coche elegido pierde
      y ningún otro— se absorbe: la derivación devuelve pesos y conjunto no
      vacío, sin lanzar (requisito 2.4).
- [x] Sobre treinta perfiles sintéticos que atribuyen, la tanda se cierra en
      **menos preguntas** que sin atribuir, y el acuerdo con cinco respuestas
      es **0,90 como mínimo** (requisito 2.6).
- [x] «Me da igual» no ofrece marcar ejes (requisito 2.5).
- [x] El segundo paso no muestra ninguna nota, porcentaje, nota de eje ni
      puesto (requisito 3.4).
- [x] «Deshacer» tras atribuir retira la elección y la atribución juntas, y
      devuelve el avance al valor exacto anterior (requisito 3.3).
- [x] `CONFIG_VERSION` no cambia y no se añade ninguna clave de
      almacenamiento.
- [x] La CI entera pasa en local, `npm run test:recovery` incluido —esta spec
      toca `src/domain/calibration.ts`, que es una de sus cuatro entradas
      (`docs/proceso/ci-y-guardarrailes.md` §4)—, con cobertura al 100 % en
      `domain/`, `data/` y `logging/`.

**Verificado el 2026-09-02**, criterio a criterio y contra la evidencia real
que lo cierra, no contra una carrera completa de la suite. En el orden en que
aparecen en la lista de arriba:

- **El primero, el segundo, el quinto, el sexto, el séptimo, el octavo, el
  undécimo y el duodécimo**, contra tests unitarios
  (`src/domain/calibration.test.ts`,
  `src/ui/components/CalibrationDialog.test.tsx`). El representante (primero
  y quinto) se verifica combinación a combinación contra una
  reimplementación independiente del conjunto compatible y del centro, no
  solo por sus propiedades. La atribución imposible (octavo) tiene además
  demostración algebraica en el propio test: con pesos que no pueden ser
  negativos, marcar el único eje en que se pierde nunca puede hacer ganar. El
  deshacer con atribución (duodécimo) usa una respuesta con `decisiveAxes`
  real, no una simplificada.
- **El tercero, el cuarto y el noveno**, contra `npm run test:recovery`
  (`src/domain/calibration.recovery.test.ts`), sobre los mismos treinta
  perfiles sintéticos del diagnóstico que motivó la spec: 0,07 ejes en cero a
  tres respuestas (el criterio pedía ≤0,5 — antes de esta spec, 4,50), y
  0,86 / 0,90 de acuerdo donde el criterio pedía ≥0,82 y ≥0,90.
- **El décimo**, contra el navegador sobre el *build* de producción con
  Playwright: pulsar «Me da igual» avanza directamente al siguiente cara a
  cara, sin que el paso de atribución llegue a aparecer.
- **El decimotercero**, por inspección directa: `CONFIG_VERSION` sigue en 3
  (`src/domain/config.ts`) y `localStorageConfigPort.ts` no declara ninguna
  clave nueva.
- **El decimocuarto**, contra la CI entera en local: 680 tests y cobertura
  100 % en `domain/`+`data/`+`logging/`, más `npm run test:recovery` (4
  tests, ~20 s suelto).

Y dos comprobaciones más en el navegador, fuera de la lista pero parte del
mismo requisito 3.4: el paso de atribución no muestra ninguna nota, porcentaje
ni puesto, y no hay desbordamiento horizontal a 390px con el paso de
atribución abierto.

## Dependencias y supuestos

- **Depende del ADR 0011**, cuya decisión 4 ya prevé este cambio: los pesos
  propuestos son «un representante declarado del conjunto compatible, elegido
  por una regla determinista y publicada». Esta spec cambia **la regla**, no
  el marco. El ADR nombra la regla vieja y se corrige en su sitio, con entrada
  fechada en su historial (ADR 0005).
- **El hallazgo central del ADR 0011 sigue en pie.** La desigualdad que añade
  la atribución también es homogénea, así que el conjunto compatible sigue
  siendo un cono y sigue sin haber pesos que recuperar. Atribuir estrecha el
  cono más deprisa; no lo convierte en un punto.
- **`product/0035` está `consolidated` y no se edita.** Esta spec la amplía,
  con el mismo precedente con que `product/0020` amplió a `product/0018`.
- **Supone que quien elige sabe por qué elige**, al menos a veces. Es la
  apuesta de la fase 2, y por eso atribuir es opcional: cuando no se sabe, «No
  sabría decir» deja la respuesta como está hoy.
- **Los perfiles sintéticos no son personas.** Un perfil sintético atribuye
  siempre con exactitud, calculando qué ejes bastan para dar la vuelta a su
  propia decisión. Una persona se equivocará más. El requisito 2.4 es lo que
  absorbe esa diferencia, pero las cifras del requisito 2.6 son un techo, no
  una previsión.

## Decisiones abiertas

Ninguna.
