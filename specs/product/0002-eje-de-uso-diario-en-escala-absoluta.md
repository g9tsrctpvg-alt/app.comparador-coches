# 0002 — El eje de uso diario, en escala absoluta

- **Id:** product/0002
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-04
- **Specs relacionadas:** product/0001
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`

## Contexto

El eje `diario` mide lo incómodo que resulta un coche en el día a día:
aparcar, calles estrechas, entrar en el garaje. Hoy se calcula así:

```text
dificultad = 0,6 × anchura(mm) + 0,4 × longitud(mm)
```

y esa dificultad se normaliza **contra los otros diez candidatos**,
invertida: el de dificultad más alta saca un 0 y el más bajo un 10.

Tiene dos problemas, y el segundo no se ve a simple vista.

**Los pesos no significan lo que dicen.** `0,6/0,4` declara que la anchura
importa más que la longitud, que es lo razonable: lo que complica aparcar
suele ser el ancho. Pero al sumar milímetros con milímetros, lo que decide la
nota no es el peso sino **cuánto varía cada magnitud entre los candidatos**.
La anchura de los once va de 1802 a 1866 mm —64 mm de recorrido—; la
longitud, de 4300 a 4706 mm —406 mm—. La longitud varía seis veces más, así
que la influencia real acaba siendo **anchura 19% / longitud 81%**, casi la
inversa de lo declarado. El modelo dice que le importa el ancho y calcula que
le importa el largo.

**La nota no dice si el coche es cómodo, dice en qué puesto va.** Es el
problema general que recoge el ADR 0004. Aquí se ve claro: el EV3 saca hoy un
10 en uso diario, pero mide 1850 mm de ancho — no es un coche cómodo de
ciudad, es *el menos incómodo de once coches incómodos*. Con anclajes
absolutos razonables, los once candidatos caben entre 3,2 y 5,6 sobre 10.

Los dos problemas tienen la misma raíz y se arreglan con el mismo cambio: al
poner anchura y longitud en una escala común **antes** de aplicar los pesos,
`0,6/0,4` pasa a significar lo que dice, sin tener que tocarlo aparte.

## Objetivo

Que la nota de uso diario de un coche dependa de sus medidas y de un criterio
escrito, y no de qué otros coches estén en la lista.

## Alcance

- **Una escala absoluta para la anchura** y **otra para la longitud**, cada
  una con su anclaje de saturación —nota 10, por debajo ya no mejora— y su
  anclaje de rechazo —nota 0, a partir de ahí es inaceptable—.
- **La forma de la escala**: curva en S entre anclajes y saturación fuera de
  ellos.
- **La combinación de ambas** con los pesos ya declarados, que a partir de
  ahora rigen de verdad.
- **El desglose de este eje**: en vez de nombrar qué modelo marca cada
  extremo, muestra la escala usada y dónde cae el coche en ella.

## Fuera de alcance

- **Los otros cinco ejes.** Cada uno tiene su naturaleza y sus anclajes;
  migrarlos de golpe sería asumir que el problema y la solución son iguales
  en todos, y no lo son. Uno por spec.
- **Recalibrar los pesos por eje.** Este cambio deja `diario` moviendo unos
  2,4 puntos en vez de 10, así que su peso 3 deja de significar lo mismo. Es
  una consecuencia conocida, con su propia decisión pendiente: no se resuelve
  aquí, donde solo un eje ha migrado y compararlo con los otros cinco todavía
  no tendría sentido.
- **Añadir un coche de referencia al catálogo** para calibrar anclajes.
  Ayudaría, pero es una decisión sobre el catálogo, no sobre este eje.
- **Cambiar qué magnitudes entran en el eje.** Siguen siendo anchura y
  longitud. Si algún día entra la altura o el radio de giro, será otra spec.
- **La penalización por no tener carga en casa.** Se mantiene exactamente
  como está: es condicional a la tecnología y no depende de la escala.

## Las dos escalas

La **anchura no estorba para circular, estorba para aparcar**: por una calle
normal pasa hasta una furgoneta de reparto. Sus anclajes se calibran contra
esa pregunta, no contra la de circular.

| Magnitud | Nota 10 hasta | Nota 0 desde |
| --- | --- | --- |
| Anchura | **1765 mm** | **2000 mm** |
| Longitud | **4000 mm** | **5200 mm** |

Ambas medidas son **de carrocería, sin espejos**, que es la convención de las
fichas técnicas de las que sale el catálogo. Importa decirlo: los espejos
suman con facilidad 15-20 cm, así que un coche en el anclaje de rechazo de
anchura mide en realidad unos 2,15 m de lado a lado.

Entre los dos anclajes la nota sigue una **curva en S** (*smoothstep*):

```text
t    = posición entre anclajes, 0 en el bueno y 1 en el malo
nota = 10 × (1 − t²(3 − 2t))
```

La pendiente es cero en los dos anclajes y máxima en el centro. Traduce dos
intuiciones: afinar cerca del extremo bueno no compra casi nada —todos son
cómodos—, y estar cerca del extremo malo es casi tan malo como estarlo. La
zona intermedia es donde la decisión se juega, y es donde la curva discrimina.

### De dónde salen los anclajes

Calibrados contra modelos conocidos, con sus medidas tomadas de
[motor.es](https://www.motor.es/):

| Modelo | Anchura | Longitud | Nota del eje |
| --- | --- | --- | --- |
| Smart Fortwo | 1663 | 2695 | 10,0 |
| Fiat 500 | 1627 | 3571 | 10,0 |
| Opel Corsa | 1765 | 4060 | 10,0 |
| VW Polo | 1751 | 4074 | 10,0 |
| Alfa Romeo Giulietta | 1798 | 4351 | 8,9 |
| Mercedes Clase E | 1852 | 4923 | 4,7 |
| Mercedes Clase S | 1954 | 5179 | 0,6 |
| Audi Q7 | 2010 | 5056 | 0,2 |
| Range Rover | 2003 | 5252 | 0,0 |

El razonamiento de cada anclaje:

- **Anchura, nota 10 en 1765 mm.** Corsa y Polo son la referencia de «esto ya
  no es un problema». Por debajo hay 15 cm más de coches —Picanto 1595, Fiat
  500 1627, Smart 1663—, pero no son más fáciles de aparcar *por estrechos*:
  la gracia del Smart es su longitud. Ahí la anchura satura.
- **Anchura, nota 0 en 2000 mm.** Es el techo práctico del mercado de
  turismos: Clase S 1954, BMW X7 2000, Range Rover 2003, Audi Q7 2010 caben
  todos en 56 mm. Un 0 significa «has llegado al límite de lo que se
  fabrica». Se descartó anclar el 0 en algo verdaderamente inmanejable —una
  caravana, en torno a 2,3 m— porque hundiría la escala: los once candidatos
  quedarían entre 9,1 y 9,9, indistinguibles, y un Range Rover sacaría un
  5,9 en facilidad de aparcamiento.
- **Longitud, nota 10 en 4000 mm.** Por debajo de cuatro metros el coche
  aparca en cualquier hueco; afinar más deja de importar.
- **Longitud, nota 0 en 5200 mm.** Aquí el límite no lo pone el mercado sino
  la plaza de aparcamiento. Se consideró 5000 mm —el largo de una plaza
  estándar— y se descartó por severo: dejaba en 2,3-2,9 a candidatos de 4,7 m
  que caben en una plaza normal.

Las escalas **no dependen del catálogo**: son las mismas con once candidatos
que con uno. Cambiarlas exige un razonamiento explícito, no un ajuste.

## Requisitos / comportamiento esperado

1. La anchura se puntúa contra su escala absoluta: nota 10 en 1765 mm o por
   debajo, nota 0 en 2000 mm o por encima, curva en S entre ambos.
2. La longitud se puntúa igual contra la suya: 10 hasta 4000 mm, 0 desde
   5200 mm.
3. Las dos notas resultantes, ya en la misma escala, se combinan con los
   pesos declarados del eje. Los pesos rigen sobre notas comparables, no
   sobre milímetros.
4. Ninguna nota de este eje depende de qué otros coches haya en el catálogo.
   Añadir, quitar o editar un candidato no cambia la nota de los demás.
5. Los anclajes son parte del modelo, no un supuesto global editable desde el
   panel: cambiarlos es una decisión razonada, no un deslizador.
6. El desglose del eje muestra, para cada magnitud, el valor del coche, los
   dos anclajes de su escala y la nota que sale. Sustituye a nombrar el
   modelo que marca cada extremo, que en una escala fija ya no significa nada.
7. La penalización por no tener carga en casa sigue aplicándose igual, como
   línea propia, después de combinar las dos notas.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] La nota de uso diario de un coche es la misma tanto si el catálogo tiene
      once candidatos como si tiene uno solo.
- [ ] Un coche de 1765 mm de ancho saca un 10 en anchura, y uno de 1663 mm
      —un Smart— saca también un 10.
- [ ] Un coche de 2000 mm de ancho saca un 0 en anchura, y uno de 2010 mm
      —un Audi Q7— saca también un 0.
- [ ] Un coche en el punto medio de una escala saca un 5 en esa magnitud, y
      uno al 10% del anclaje malo saca menos de 1: la curva es en S, no una
      recta.
- [ ] Dos coches que difieran solo en anchura, en una fracción dada de su
      escala, se separan más en la nota del eje que otros dos que difieran
      solo en longitud en esa misma fracción, en la proporción que declaran
      los pesos.
- [ ] El desglose del eje muestra los dos anclajes de cada escala y la nota
      que sale de cada magnitud.
- [ ] El desglose del eje ya no nombra qué modelo marca el mínimo ni el
      máximo.
- [ ] La penalización por carga en casa sigue apareciendo como línea propia,
      con su condición y su efecto.

## Dependencias y supuestos

- Depende del ADR 0004, que decide el principio de escalas absolutas. Si ese
  ADR no se aprueba, esta spec no tiene sentido.
- Sucede al requisito 6 de `product/0001` **solo para este eje**. Aquella
  spec está `consolidated` y no se toca; los cinco ejes que siguen con
  normalización relativa mantienen su comportamiento hasta que cada uno tenga
  la suya.
- Se asume que las magnitudes del eje siguen siendo anchura y longitud, y que
  los pesos entre ambas siguen siendo los declarados hoy.

## Decisiones abiertas

Ninguna.
