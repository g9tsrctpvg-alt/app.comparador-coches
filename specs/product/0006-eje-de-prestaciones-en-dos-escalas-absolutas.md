# 0006 — El eje de prestaciones, en dos escalas absolutas

- **Id:** product/0006
- **Estado:** implemented
- **Tipo:** product
- **Fecha:** 2026-08-05
- **Specs relacionadas:** product/0001, product/0002, product/0003
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

El eje `prestaciones` mide el empuje del coche a partir de dos magnitudes:

```text
0,5 × norm(CV por tonelada) + 0,5 × norm(aceleración 0-100, invertida)
```

**Es el primer eje que llega estructuralmente sano.** A diferencia de
`diario`, aquí cada sumando se normaliza por separado antes de mezclarse, así
que el 0,5/0,5 declarado sí rige sobre notas comparables. Lo único que hay
que cambiar es contra qué se normaliza.

Y ahí sigue el problema del ADR 0004: los extremos los ponen los candidatos.
Hoy el Sportage saca un 10 en CV/tonelada por ser el que más tiene de once, y
el CX-5 un 0 por ser el que menos. Ninguna de las dos notas dice si el coche
empuja bien.

**Qué mide cada magnitud, y por qué siguen las dos.** Estos no son coches que
se compren por acelerar, y en general son pesados. Las dos magnitudes no
están para ordenarlos por velocidad, sino para detectar en qué destaca y en
qué flojea cada uno:

- **CV por tonelada** mide el empuje disponible —adelantar, incorporarse,
  subir con el coche cargado—. Ignora tracción y cambio, y por eso se
  contrasta con la otra.
- **La aceleración 0-100** mide lo que el coche realmente entrega. Es donde
  se ve el peaje de un e-CVT o de una tracción total.

Las dos están **correlacionadas a r = 0,81** sobre el catálogo actual, así
que buena parte del tiempo dirán lo mismo. Se mantienen porque el interés
está justo en el resto: cuando discrepan es cuando informan.

## Objetivo

Que la nota de prestaciones diga si un coche empuja bien, no en qué puesto va
de once, y que la discrepancia entre potencia disponible y entrega real siga
siendo visible.

## Alcance

- **Una escala absoluta para CV por tonelada** y **otra para la aceleración
  0-100**, cada una con su anclaje de saturación y su anclaje de rechazo.
- **La forma de la escala**: la misma curva en S de `product/0002`.
- **La combinación de ambas** con el 0,5/0,5 ya declarado, que aquí no
  cambia de significado porque ya regía sobre notas normalizadas.
- **El desglose del eje**: las dos magnitudes con su valor, sus anclajes y su
  nota.

## Fuera de alcance

- **Cambiar qué magnitudes entran en el eje.** Siguen siendo CV/tonelada y
  aceleración. Meter par motor, recuperación 80-120 o tracción sería otra
  spec.
- **Cambiar el reparto 0,5/0,5.** Sigue igual, y sigue significando lo que
  dice: los dos sumandos ya se normalizan por separado.
- **Corregir los datos del catálogo.** Esta spec decide la escala; los datos
  que recibe son otro trabajo, y queda anotado abajo cuáles están flojos.
- **Los ejes que quedan sin migrar**: `fiabilidad`.

## Las dos escalas

| Magnitud | Nota 10 | Nota 0 |
| --- | --- | --- |
| CV por tonelada | **desde 145** | **hasta 75** |
| Aceleración 0-100 | **hasta 6,5 s** | **desde 13,0 s** |

Entre anclajes, la misma **curva en S** que fija `product/0002`:
`nota = 10 × (1 − t²(3 − 2t))`, con `t` = 0 en el anclaje bueno y 1 en el malo.

### De dónde salen los anclajes

Calibrados contra modelos conocidos, con sus cifras de
[motor.es](https://www.motor.es/):

| Modelo | CV | Peso | CV/t | 0-100 |
| --- | --- | --- | --- | --- |
| Fiat Panda 1.0 Hybrid GSE | 70 | 980 kg | 71,4 | 14,7 s |
| Dacia Sandero TCe 90 | 91 | 1.099 kg | 82,8 | 13,4 s |
| VW Golf 1.5 TSI 150 | 150 | 1.317 kg | 113,9 | 8,6 s |
| Alfa Romeo Giulietta 1.4 MultiAir 170 TCT | 170 | 1.355 kg | 125,5 | 7,7 s |
| Toyota RAV4 220H 4x4 | 222 | 1.665 kg | 133,3 | 8,1 s |
| VW Golf GTI | 245 | — | — | 6,4 s |
| Cupra Formentor VZ | 310 | — | — | 4,9 s |

**Los ceros están anclados en coches reales que van justos**, no en un
supuesto. El Panda con 71 CV/t y el Sandero con 13,4 s son el suelo práctico
del mercado: coches que funcionan, pero en los que incorporarse a una autovía
cargado es un cálculo. Poner el 0 más abajo hundiría la escala y dejaría a
los once candidatos indistinguibles en la zona alta.

**Los dieces están donde el empuje deja de ser un tema.** El Giulietta
MultiAir de 170 CV es la referencia de primera mano: adelanta con soltura y
va suave, es más rápido que la media de coches normales, pero no es un
deportivo. Debe sacar buena nota **con margen por encima** — un 10 tiene que
significar «esto ya no se puede pedir», no «lo que ya tengo». De ahí 145 CV/t
y 6,5 s: por encima de un Giulietta 170, en el territorio del Golf GTI.

Se descartó una escala más blanda —10 desde 130 CV/t y hasta 7,5 s— porque
dejaba a seis de los once candidatos por encima de 9,7 en aceleración: el eje
habría dejado de decir nada en su mitad alta, y habría puesto al Giulietta en
un 10 redondo.

**El peso no entra dos veces.** Un coche pesado ya paga en `diario` por
tamaño y en `coste` por consumo; aquí el peso solo aparece dividiendo a los
CV, que es exactamente lo que se quiere medir.

### Dónde caen los candidatos

| Coche | CV/t | Nota | 0-100 | Nota |
| --- | --- | --- | --- | --- |
| Sportage HEV | 147,5 | 10,0 | 7,9 s | 8,8 |
| X1 xDrive25e | 126,9 | 8,3 | 6,8 s | 9,9 |
| Kona Eléctrico | 126,3 | 8,2 | 7,8 s | 9,0 |
| Civic e:HEV | 124,3 | 7,9 | 7,9 s | 8,8 |
| EV3 | 113,3 | 5,7 | 7,7 s | 9,1 |
| NX 350h | 110,7 | 5,1 | 8,8 s | 7,1 |
| Tonale | 109,4 | 4,9 | 8,5 s | 7,7 |
| Corolla Cross | 101,1 | 3,1 | 11,1 s * | 2,1 |
| CR-V e:HEV | 100,8 | 3,1 | 9,5 s * | 5,6 |
| Kona HEV | 92,9 | 1,6 | 11,0 s | 2,3 |
| CX-5 | 86,6 | 0,7 | 10,5 s | 3,3 |

`*` cifras no verificadas; ver supuestos.

La escala hace visible lo que la relativa tapaba: **el Sportage tiene el
mejor empuje disponible de los once y sin embargo no es el más rápido**, y el
X1 al revés. Esa discrepancia es justo lo que las dos magnitudes existen para
enseñar.

Las escalas **no dependen del catálogo**: son las mismas con once candidatos
que con uno. Cambiarlas exige un razonamiento explícito, no un ajuste.

## Requisitos / comportamiento esperado

1. Los CV por tonelada se puntúan contra su escala absoluta: nota 10 desde
   145 CV/t o por encima, nota 0 en 75 CV/t o por debajo, curva en S entre
   ambos.
2. La aceleración 0-100 se puntúa contra la suya: nota 10 en 6,5 s o por
   debajo, nota 0 en 13,0 s o por encima, curva en S entre ambos.
3. Las dos notas se combinan al 0,5/0,5, como hoy.
4. Ninguna nota de este eje depende de qué otros coches haya en el catálogo.
5. Los anclajes son parte del modelo, no un supuesto global editable desde el
   panel.
6. El desglose muestra, para cada magnitud, el valor del coche, los dos
   anclajes de su escala y la nota que sale. Sustituye a nombrar el modelo
   que marca cada extremo.
7. El desglose sigue declarando que CV/tonelada ignora tracción y cambio, y
   que por eso se contrasta con la aceleración real.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un coche de 145 CV/t saca un 10 en esa magnitud, y uno de 180 CV/t saca
      también un 10.
- [ ] Un coche de 75 CV/t saca un 0, y uno de 60 CV/t saca también un 0.
- [ ] Un coche que hace el 0-100 en 6,5 s saca un 10 en esa magnitud, y uno
      que lo hace en 5,0 s saca también un 10.
- [ ] Un coche que hace el 0-100 en 13,0 s saca un 0, y uno que lo hace en
      15,0 s saca también un 0.
- [ ] Un coche en el punto medio de una escala saca un 5 en esa magnitud, y
      uno al 10% del anclaje malo saca menos de 1: la curva es en S, no una
      recta.
- [ ] La nota del eje de un coche es la misma con once candidatos en el
      catálogo que con uno solo.
- [ ] Dos coches con los mismos CV/t y distinta aceleración obtienen notas de
      eje distintas.
- [ ] El desglose del eje muestra los dos anclajes de cada escala y la nota
      que sale de cada magnitud.
- [ ] El desglose del eje ya no nombra qué modelo marca el mínimo ni el
      máximo.

## Dependencias y supuestos

- Depende del ADR 0004, que decide el principio de escalas absolutas.
- Sucede al requisito 6 de `product/0001` **solo para este eje**.
- Se asume que las magnitudes del eje siguen siendo CV/tonelada y aceleración
  0-100, y que el reparto entre ambas sigue siendo 0,5/0,5.
- **El peso del Giulietta son 1.355 kg**, según la página de medidas de
  motor.es, lo que da 125,5 CV/t. Es un peso de modelo, no de la versión
  1.4 MultiAir 170 concreta, pero cae dentro del rango que acotan sus dos
  fichas vecinas —1.280 kg el 1.4 TB 120 CV, 1.410 kg el 2.0 JTD 170 TCT—.
  Solo afecta a la fila de referencia, no a ningún candidato.
- **La aceleración del Corolla Cross 140H sigue sin verificar.** motor.es
  publica la del 200H (197 CV, 8,1 s), que es la versión que las notas del
  catálogo descartan por maletero, pero no da prestaciones del 140H. El
  catálogo mantiene 11,1 s estimados, y con escala absoluta ese error va
  directo a la nota.
- **La versión del CR-V e:HEV no está declarada en el catálogo.** motor.es da
  9,0 s para la tracción delantera y 9,5 s para la 4x4, y sitúa el peso de la
  delantera en «poco más de 1.600 kg» frente a los 1.825 kg del catálogo. El
  precio de 46.645 € apunta a la 4x4, pero no consta. Resolverlo mueve la
  nota de CV/tonelada del CR-V entre 3,1 y 5,7.
- Las aceleraciones de Tonale (8,5 s) y CX-5 (10,5 s), antes estimadas, están
  verificadas contra motor.es. La del CX-5 coincidía exactamente con el
  estimado; la del Tonale baja 0,3 s.

## Decisiones abiertas

Ninguna.
