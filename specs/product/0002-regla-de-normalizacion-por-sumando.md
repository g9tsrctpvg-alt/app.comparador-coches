# 0002 — Cuándo un eje compuesto normaliza por sumando

- **Id:** product/0002
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-04
- **Specs relacionadas:** product/0001
- **ADRs relacionados:** ninguno
- **Doc de estado:** `docs/estado/dominio.md`

## Contexto

El requisito 7 de `product/0001` dice que «los ejes con fórmula compuesta
(prestaciones, fiabilidad, estética, coste) desglosan cada sumando con su
propia normalización antes de combinarlos». Los nombra a los cuatro juntos,
pero el código no los trata igual: `prestaciones` y `fiabilidad` normalizan
cada sumando, y `estética` y `coste` combinan en crudo y normalizan una sola
vez el compuesto. Esa asimetría se señaló al implementar, se mergeó sin
respuesta y quedó registrada como deuda.

Al medirla, resulta que los cuatro ejes **no son el mismo caso**, y que la
frase agrupa por un parecido superficial —«son compuestos»— en vez de por lo
que de verdad los distingue.

**Estética.** Las dos lecturas dan hoy **el mismo resultado, exactamente**:
diferencia cero en los once candidatos y el mismo orden. No es casualidad.
Normalizar es una transformación afín, y las notas de exterior e interior
comparten rango en el catálogo actual (mínimo 2, máximo 5). Cuando el rango
coincide, `mix × norm(ext) + (1 − mix) × norm(int)` y
`norm(mix × ext + (1 − mix) × int)` son la misma función. Las dos lecturas
solo divergirían si algún día las dos notas dejaran de compartir rango.

**Coste.** Aquí la lectura «por sumando» ni siquiera está definida.
`prestaciones`, `fiabilidad` y `estética` combinan sus sumandos con **pesos
declarados** —`0,7/0,3`, `0,5/0,5`, `mix`—, y por eso tiene sentido
normalizar cada uno antes de mezclarlos. `coste` no tiene pesos: suma euros
con euros. Normalizar precio, energía y mantenimiento por separado obligaría
a **inventar pesos que nadie ha decidido**, y destruiría la información que
la suma ya contiene: hoy el precio pesa entre el 56% y el 71% del coste
bruto de cada coche, y el mantenimiento entre el 6% y el 12%. Normalizados
por separado, ambos pesarían lo mismo.

El problema, entonces, nunca fue el código: es que el requisito está mal
redactado. El criterio real no es «tener varios sumandos», sino **si los
sumandos llevan pesos declarados o son magnitudes ya conmensurables entre
sí**.

## Objetivo

Que la regla de cuándo un eje normaliza por sumando quede escrita sin
ambigüedad, y que la asimetría entre los cuatro ejes compuestos se lea como
lo que es —una consecuencia de la regla— y no como una inconsistencia.

## Alcance

- **La regla, enunciada por su criterio real** en `docs/estado/dominio.md`:
  un eje normaliza cada sumando por separado cuando los combina con pesos
  declarados; normaliza el compuesto una sola vez cuando suma magnitudes ya
  conmensurables.
- **La clasificación de los seis ejes** según esa regla, para que ninguno
  quede en duda.
- **Un test que fija las puntuaciones vigentes** de los once candidatos con
  los pesos y supuestos por defecto, de modo que cualquier cambio futuro en
  el orden de normalización deje de ser silencioso.
- **Cierre de la deuda** del requisito 7 en `docs/roadmap.md`.

## Fuera de alcance

- **Cambiar cualquier fórmula, orden de normalización o puntuación.** Esta
  spec no mueve un solo número: escribe la regla que el código ya sigue.
- **Editar `product/0001`.** Está `consolidated` y no se toca; esta spec la
  sucede en lo relativo al requisito 7, y el estado vigente se lee en el doc
  de estado, no en ninguna de las dos.
- **Cotas por campo del catálogo** y el resto de deudas abiertas. Cada una
  en la suya.
- **Decidir qué pasaría si las notas de estética dejaran de compartir
  rango.** Hoy lo comparten; si algún día no, se decide entonces y con datos,
  no ahora por si acaso.

## Requisitos / comportamiento esperado

1. Un eje que combina sus sumandos con **pesos declarados** normaliza cada
   sumando antes de combinarlos: `prestaciones` (0,5/0,5), `fiabilidad`
   (0,7/0,3) y `estética` (`mix`).
2. Un eje que suma **magnitudes ya conmensurables** —euros con euros,
   milímetros con milímetros— combina primero y normaliza el compuesto una
   sola vez: `coste` y `diario`.
3. Un eje de un solo sumando normaliza ese sumando: `viaje`.
4. `estética` es hoy el caso en que la regla 1 y la regla 2 coinciden en
   resultado, porque sus dos notas comparten rango. El doc de estado lo dice,
   para que nadie lea la implementación vigente como una desviación.
5. Ninguna puntuación cambia respecto a la vigente antes de esta spec.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `docs/estado/dominio.md` enuncia la regla por su criterio —pesos
      declarados frente a magnitudes conmensurables— y no por el número de
      sumandos.
- [ ] `docs/estado/dominio.md` clasifica los seis ejes según esa regla, sin
      dejar ninguno sin clasificar.
- [ ] Existe un test que fija la puntuación total de los once candidatos con
      pesos y supuestos por defecto, y pasa sin modificar ningún valor
      calculado hoy.
- [ ] Ese test falla si se cambia el orden de normalización de `estética` o
      de `coste`, comprobado antes de revertir el cambio.
- [ ] La deuda del requisito 7 ya no figura como abierta en
      `docs/roadmap.md`.
- [ ] La secuencia completa de CI pasa, con el suelo de cobertura vigente
      intacto.

## Dependencias y supuestos

- Sucede a `product/0001` en lo relativo a su requisito 7. Aquella spec queda
  intacta como registro histórico.
- Se asume que las notas de estética siguen compartiendo rango en el
  catálogo; si dejaran de compartirlo, la regla 1 y la 2 dejarían de
  coincidir para ese eje y habría que decidir cuál rige.
- Se asume que las fórmulas vigentes de los seis ejes no cambian.

## Decisiones abiertas

Ninguna.
