# 0041 — La garantía sale de la nota de fiabilidad

- **Id:** product/0041
- **Estado:** verified
- **Tipo:** product
- **Fecha:** 2026-09-07
- **Specs relacionadas:** product/0001, product/0007, product/0035
- **ADRs relacionados:** 0004, 0010
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio en
> el momento en que se redactó; su sección *Contexto* retrata el sistema
> **anterior** al cambio y hoy es histórica. Para el estado actual, ver
> `docs/estado/dominio.md`. Vigentes aquí solo los **criterios de
> aceptación**, como registro de verificación.

## Contexto

El eje `fiabilidad` puntúa hoy dos magnitudes contra dos escalas absolutas y
las combina al 0,7/0,3:

```text
nota = 0,7 × escala(índice OCU) + 0,3 × escala(garantía incondicional)
```

`product/0007` fijó las dos escalas y dejó el reparto 0,7/0,3 **explícitamente
fuera de alcance**: no lo defendió, lo heredó. Esta spec es esa discusión
pendiente, y su conclusión es que el sumando de garantía no debería estar ahí.

### Lo que la garantía hace hoy, medido sobre los dieciocho publicados

Su aportación al eje va de **1,18** —los seis coches de 3 años: Corolla Cross,
los dos Nissan, ID.4, C5 Aircross y Compass— a **3,00** —los tres Kia, de 7
años—. Son 1,82 puntos de eje, **12,73 puntos de total** sobre 400 y **3,18
puntos porcentuales** de la nota publicada.

Tres hallazgos que `product/0007` no tenía delante:

**1. La garantía comprime el eje en vez de separarlo.** Con solo el índice
OCU el eje recorre 9,86 puntos sobre los dieciocho publicados; con la garantía
dentro, 8,46. No añade capacidad de distinguir: la resta, y además reordena.

**2. El ancla en 0 años es un suelo regalado.** Ningún coche a la venta tiene
menos de 3 años —mínimo legal en España desde enero de 2022—, así que el
sumando de garantía nunca baja de 3,94 y siempre aporta al menos 1,18 al eje.
El Compass, cuya marca ancla el suelo de la escala OCU, no puede sacar menos
de 1,18 en un eje llamado fiabilidad. `product/0007` ancló el 0 en 0 años por
una razón buena —no convertir una decisión comercial en un cero absoluto—,
pero el efecto sobre el eje es este.

**3. La curva discrimina donde no hay nada que discriminar.** La curva en S
del ADR 0004 tiene su máxima pendiente en el centro de la escala, que aquí cae
en 3,5 años:

| Tramo | Puntos por año |
| --- | --- |
| 2 → 3 años | 1,95 |
| **3 → 4 años** | **2,13** |
| 4 → 5 años | 1,95 |
| 5 → 6 años | 1,43 |
| 6 → 7 años | 0,55 |

Es decir: separa al máximo en el tramo en el que un coche normal casi nunca
tiene una avería grave, y se aplana justo en los años 6 y 7, que son los
únicos en los que la garantía empieza a pagar algo que el comprador habría
pagado de su bolsillo. `product/0007` detectó la pendiente —«efecto lateral
conocido»— y la defendió con que «el tercer y cuarto año es cuando las cosas
empiezan a fallar». Esa premisa y la de esta spec —que antes de los cinco años
es raro que un coche normal tenga un fallo crítico— no pueden ser las dos
ciertas, y la segunda es la que sostiene el usuario que decide.

**Y un cuarto, sobre qué garantía se está puntuando.** Dieciséis de los
dieciocho publicados son electrificados, y el fallo caro de un electrificado
es la batería de tracción, que va con garantía propia —del orden de 8 años— y
que el catálogo no declara en ningún campo. El número que hoy puntúa no es el
que cubre el riesgo caro de casi todo el catálogo.

### Lo que la nota está pagando por la garantía, en euros

El estimado que la casa exige antes de comprometer trabajo (precedente: P9)
no necesita ningún dato nuevo: basta usar el eje `coste` como tipo de cambio,
porque es el único eje denominado en dinero.

Los 12,73 puntos de total que separan a un coche de 3 años de uno de 7
equivalen a 5,09 puntos de la subnota de precio (peso 5, reparto 0,5). En el
punto de **máxima** pendiente de la escala de precio —36.000 €, donde un euro
mueve más nota que en ningún otro sitio— eso son **7.471 €**. En cualquier
otro punto de la escala hacen falta más, así que 7.500 € es el suelo de la
equivalencia, no su valor típico. Por la otra mitad del eje sale lo mismo:
50,9 €/mes de coste de uso, que a los doce años escritos detrás del 50/50 de
`coste` son **7.335 €**.

Sobre un coche concreto: el Corolla Cross tendría que costar **9.439 € menos**
—36.500 € → 27.061 €— para recuperar por precio lo que pierde por tener 3 años
de garantía en vez de 7.

El modelo está afirmando, por tanto, que cuatro años más de garantía general
valen más de 7.500 €. No hay ninguna lectura del mercado en la que eso sea
cierto.

### El argumento que la propia `product/0007` ya escribió

`product/0007` rechaza meter el índice de satisfacción de la OCU —dato de la
misma encuesta, misma escala, misma granularidad— porque «añadiría una tercera
señal de gusto (…) dentro del único eje cuyo trabajo es decir si el coche se
avería». El argumento es simétrico y condena igual a la garantía: los años de
garantía son una **señal de política comercial** dentro del único eje cuyo
trabajo es decir si el coche se avería. Kia da siete años porque entró tarde
en Europa y necesitaba comprar confianza; Toyota da tres y es la segunda marca
más fiable de las treinta y nueve que mide la OCU. Que el compromiso comercial
mueva la nota de fiabilidad tres puntos porcentuales es exactamente el ruido
que el eje debería estar filtrando.

## Objetivo

Que la nota de `fiabilidad` diga solo cuánto se avería el coche, y que los
años de garantía se lean donde no distorsionan: como dato del coche que no
puntúa.

## Alcance

- **La fórmula del eje**: pasa a ser la nota del índice OCU, sin más sumandos.
- **El trato de `warrantyYears`**: sigue en el catálogo, con su fuente, y pasa
  a mostrarse como información que no puntúa, el mismo trato que ya recibe la
  extensión condicionada.
- **El nombre del eje**: «Fiabilidad y garantía» deja de describir lo que hace.
- **El desglose y la página de explicación**: dejan de anunciar una magnitud
  que ya no entra en la nota.
- **La nueva medición del *snapshot* de `scoreCatalog`**, que cambia para los
  veintiún registros.

## Fuera de alcance

- **Los anclajes del índice OCU**, que no se tocan: 93 y 64 siguen siendo los
  extremos publicados, y el ADR 0010 prohíbe apretarlos contra el catálogo.
- **El peso por defecto del eje**, que sigue en 7. Cambiar lo que un eje mide
  es motivo razonable para volver a derivar los pesos, pero eso es la tanda de
  `product/0035` entera y no cabe aquí; queda anotado como deuda.
- **Meter la garantía en `coste` como coste esperado de reparación en euros.**
  Es el sitio donde la magnitud compite por su tamaño real, y es la línea de
  trabajo natural detrás de esta spec, pero exige un dato que el catálogo no
  tiene —coste esperado de reparación por año de vida— y se registra como
  propuesta, no como alcance.
- **Modelar la garantía de la batería de tracción**, que es la que cubre el
  fallo caro de dieciséis de los dieciocho publicados. Mismo motivo: dato
  nuevo, propuesta propia.
- **Borrar `warrantyYears` del catálogo.** Sigue siendo un dato real, con
  fuente, que el comprador quiere ver.
- **Corregir el 64 asignado a Jeep**, que esta spec vuelve plenamente
  decisivo. Es deuda ya registrada y corroborada, y no se cierra aquí.

## Requisitos / comportamiento esperado

1. La nota de `fiabilidad` es `escala(índice OCU)`: nota 10 desde 93, nota 0
   hasta 64, curva en S entre ambos. Ningún otro sumando.
2. `warrantyYears` sigue siendo obligatorio en `Car` y conserva su fuente. No
   entra en ninguna nota de ningún eje.
3. El desglose del eje muestra en `info` los **años de garantía incondicional**
   del coche, declarando que no puntúan, y sigue mostrando la **extensión
   condicionada** cuando existe, con sus años, su límite de kilómetros y su
   condición.
4. El desglose del eje conserva **un** subcomponente, el índice OCU, con su
   valor, sus dos anclajes y su nota, y ya no tiene subcomponente de garantía.
5. El desglose sigue declarando que el índice de fiabilidad es **por marca**,
   no por modelo.
6. El eje se llama **«Fiabilidad»** en el ranking, en la ficha, en el reparto
   de la diferencia entre dos coches y en la página de explicación.
7. La página de explicación describe el eje por lo que mide ahora: qué mide,
   qué dato usa, y por qué la garantía se muestra pero no puntúa.
8. La nota del eje de un coche no depende de qué otros coches haya en el
   catálogo.
9. El peso por defecto de `fiabilidad` no cambia.

## Lo que cambia en la clasificación publicada

Medido con `scoreCatalog` y los pesos por defecto sobre los dieciocho
publicados:

| Coche | OCU | Años | Eje antes | Eje después | Total antes | Total después | Puesto |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tucson HEV | 87 | 5 | 8,63 | 8,89 | 64,41 % | 64,87 % | 1.º |
| Tucson PHEV | 87 | 5 | 8,63 | 8,89 | 63,19 % | 63,65 % | 2.º |
| Sportage HEV | 89 | 7 | 9,64 | 9,48 | 62,11 % | 61,84 % | 3.º |
| EV3 | 89 | 7 | 9,64 | 9,48 | 61,42 % | 61,15 % | 4.º → 5.º |
| Civic e:HEV | 89 | 5 | 9,04 | 9,48 | 59,78 % | 60,55 % | 5.º → 6.º |
| X-Trail e-Power | 87 | 3 | 7,41 | 8,89 | 58,96 % | 61,56 % | 6.º → 4.º |
| Qashqai e-Power | 87 | 3 | 7,41 | 8,89 | 57,88 % | 60,49 % | 7.º |
| EV5 | 89 | 7 | 9,64 | 9,48 | 57,23 % | 56,96 % | 8.º → 10.º |
| Kona HEV | 87 | 5 | 8,63 | 8,89 | 57,15 % | 57,61 % | 9.º → 8.º |
| Kona Eléctrico | 87 | 5 | 8,63 | 8,89 | 56,63 % | 57,09 % | 10.º → 9.º |
| CX-5 | 89 | 6 | 9,47 | 9,48 | 56,20 % | 56,22 % | 11.º |
| ID.4 | 82 | 3 | 5,92 | 6,78 | 53,08 % | 54,57 % | 12.º |
| IONIQ 5 | 87 | 5 | 8,63 | 8,89 | 52,09 % | 52,55 % | 13.º |
| ZR-V e:HEV | 89 | 5 | 9,04 | 9,48 | 51,64 % | 52,41 % | 14.º |
| Tonale | 80 | 5 | 6,45 | 5,77 | 51,34 % | 50,16 % | 15.º |
| Corolla Cross | 91 | 3 | 8,09 | 9,86 | 46,90 % | 50,01 % | 16.º |
| C5 Aircross | 76 | 3 | 3,78 | 3,72 | 45,97 % | 45,86 % | 17.º |
| Compass | 64 | 3 | 1,18 | 0,00 | 43,67 % | 41,60 % | 18.º |

**Seis puestos se mueven, el podio y el fondo no.** El movimiento grande es el
X-Trail e-Power, 6.º → 4.º, que dejaba de puntuar 1,49 por los tres años de
Nissan teniendo la fiabilidad de marca de un Hyundai. El caso que mejor
resume la spec es el Corolla Cross: la marca con el **mejor** índice del
catálogo —91, y en la tabla entera de la OCU solo Lexus, con 93, está por
encima— sacaba un 8,09 en fiabilidad porque Toyota da tres años.

**Lo que hay que mirar con cuidado antes de aprobar** es el Compass: pasa de
1,18 a 0,00 y de 43,67 % a 41,60 %. Su 64 no es una medición, es una
convención asignada por decisión del usuario porque Jeep no figura entre las
39 marcas del índice OCU. Hoy la garantía le amortigua el golpe; después, esa
convención decide sola su nota de fiabilidad. La deuda está registrada y
corroborada —el Driver Power 2026 sitúa a Jeep como la marca menos fiable de
las 30 que mide, por debajo de Land Rover, que es quien ancla ese 64—, pero
esta spec la vuelve más cara y conviene aprobarla sabiéndolo.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] Dos coches con el mismo índice OCU y distinta garantía incondicional —3
      y 7 años— sacan exactamente la misma nota de `fiabilidad`.
- [x] Un coche de una marca con índice 93 saca un 10 en el eje, y uno con 64
      saca un 0: la nota del eje es la de su índice, sin corrección.
- [x] Sobre el catálogo real y con los pesos por defecto, el Corolla Cross saca
      9,86 en `fiabilidad` (antes 8,09) y su total pasa de 46,90 % a 50,01 %.
- [x] Sobre el catálogo real y con los pesos por defecto, el Compass saca 0,00
      en `fiabilidad` (antes 1,18) y su total pasa de 43,67 % a 41,60 %.
- [x] El desglose del eje no contiene ningún subcomponente de garantía, y sí
      contiene el del índice OCU con sus dos anclajes y su nota.
- [x] El desglose del eje muestra los años de garantía incondicional como
      información que no puntúa.
- [x] Un coche con extensión condicionada sigue mostrándola en el desglose,
      con años, límite de kilómetros y condición.
- [x] El desglose declara que el índice de fiabilidad es por marca, no por
      modelo.
- [x] El eje aparece como «Fiabilidad» —sin «y garantía»— en el ranking, en la
      ficha, en el reparto de la diferencia entre dos coches y en la página de
      explicación.
- [x] La página de explicación no afirma en ningún punto que los años de
      garantía entren en la nota.
- [x] La nota de `fiabilidad` de un coche es la misma con los dieciocho
      candidatos publicados que con ese coche solo.
- [x] El *snapshot* de `scoreCatalog` recoge los veintiún totales nuevos, y la
      CI entera pasa en local.

## Dependencias y supuestos

- **Enmienda a `product/0007`, que no se edita.** Aquella spec queda
  `consolidated` como registro de lo que se decidió el 2026-08-05; su
  requisito 5 —«las dos notas se combinan al 0,7/0,3»— deja de describir el
  sistema al implementarse esta. Es el mismo trato que `product/0040` dio a
  `product/0039`, y por eso `product/0007` no pasa a `superseded`: lo que
  aquella spec decidió —las dos escalas absolutas y sus anclajes— sigue
  vigente entero; lo que decae es solo el reparto que ella misma declaró
  heredado.
- Depende del ADR 0004 (escalas absolutas) y del ADR 0010 (los anclajes son
  los extremos del mercado), que no cambian.
- Se asume que el índice OCU del catálogo sigue siendo el de la edición 2026.
- **Los pesos por defecto no se vuelven a derivar.** Salieron de `product/0035`
  con el eje midiendo dos cosas; después de esta spec mide una. El peso 7 se
  mantiene porque bajarlo sin volver a hacer la tanda sería otro número
  elegido a ojo, pero queda como deuda: la próxima tanda de calibración lo
  medirá sobre el eje nuevo.
- **El 64 de Jeep pasa a ser plenamente decisivo**, como dice la sección
  anterior. Deuda ya abierta, que esta spec encarece y no cierra.
- Se asume que el usuario mantiene la premisa que motiva la spec: antes de los
  cinco años es raro que un coche normal tenga un fallo crítico, y por tanto
  los años de garantía informan más de la estrategia comercial de la marca que
  de cuánto se avería el coche.

## Decisiones abiertas

Ninguna.
