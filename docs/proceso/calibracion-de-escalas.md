# Calibración de escalas

> Este documento manda sobre **cómo se fija la escala de un eje de puntuación
> y cómo se comprueba que el eje mide lo que dice medir**. El principio —por
> qué las escalas son absolutas y no relativas al conjunto— lo decide el
> ADR 0004; con qué criterio se eligen los dos números de cada escala, el
> ADR 0010; los anclajes concretos de cada eje viven en su spec y, una vez
> consolidados, en `docs/estado/dominio.md`.

## 1. La invariante que todo esto sirve

**Dos ejes con el mismo peso, para la misma nota, aportan los mismos
puntos.** Eso lo garantiza la aritmética: `contribución = nota × peso`.

Pero solo significa algo si **la misma nota quiere decir lo mismo en todos los
ejes**. Un 5 en coste y un 5 en uso diario tienen que ser comparables como
juicios, no solo como números; si no, el modelo es aritméticamente justo y
semánticamente falso, y sumar ejes es sumar peras con manzanas con una tabla
de conversión inventada.

De ahí sale el requisito operativo: **todo eje se ancla contra algo externo al
conjunto de candidatos**. Un eje anclado en «el mejor y el peor de los once»
no cumple la invariante, porque su 5 significa «mitad de tabla» y el de al
lado significa «mitad de lo aceptable».

## 2. El método

Se ha aplicado seis veces —los seis ejes del comparador— y produce anclajes
defendibles y discutibles. Los pasos, en orden:

1. **Decidir qué mide la magnitud, en una frase.** No «espacio», sino «si cabe
   el equipaje de cuatro personas». La frase determina qué extremos tienen
   sentido. Descubrimos con la anchura que no es lo mismo «estorba para
   circular» que «estorba para aparcar»: la misma medida, dos escalas
   distintas.
2. **Buscar modelos de referencia fuera de la lista de candidatos.** Es el
   paso que más se resiste, y el que hace que la escala no dependa del
   catálogo. El coche que marca el 10 puede no estar en la lista, y el que
   marca el 0 casi nunca lo está.
3. **Sacar sus medidas de una fuente publicada y nombrarla.** Nunca de
   memoria. Si la fuente no publica el dato, se dice que no lo publica y se
   marca como estimado: un anclaje sobre un dato inventado contamina todas las
   notas de ese eje.
4. **Presentar la tabla y pedir el juicio.** Sobre todo en el modelo que fija
   cada extremo: dos personas razonables pueden discrepar sobre qué cuenta
   como «mercado generalista» y qué queda fuera (ADR 0010). Lo que la tabla
   aporta es que el juicio se emita sobre casos concretos, con marca, modelo
   y fuente, y no sobre números abstractos.
5. **Fijar los dos anclajes y escribir el razonamiento de cada uno.** Un
   anclaje sin razonamiento escrito es un número mágico, y el siguiente que lo
   lea no sabrá si moverlo.
6. **Comprobar dónde caen los candidatos, y si el resultado es legible.**
   Ya no es una comprobación que mueva el anclaje —eso es exactamente lo que
   el ADR 0010 prohíbe: apretar la escala contra la gama comparada hace dos
   veces el trabajo que ya hacen los pesos—, pero sigue siendo la tabla que
   se presenta al aprobar. Si los candidatos se apiñan en una magnitud, es
   información real sobre lo poco que varían en ella, y quien decide cuánto
   pesa esa información es el peso del eje, nunca el anclaje.

### Elegir bien los extremos

**Los dos anclajes son los extremos del mercado real de venta al público, no
un umbral de utilidad elegido a ojo (ADR 0010).** El 10 es «no hay nada mejor
a la venta»: el mejor valor de esa magnitud en un turismo generalista, con
modelo y fuente publicada detrás. El 0 es «lo peor que se vende», con el
mismo requisito. Ninguno de los dos se elige mirando dónde caen los
candidatos del catálogo —eso fue el fallo que el ADR 0010 corrige: los
anclajes de `diario`, `viaje` y `prestaciones` se habían ido apretando contra
la gama que se estaba comparando, y un 10 en maletero llegó a significar 620
litros cuando el mercado vende 910.

**El universo que fija los extremos es el turismo generalista de venta al
público**, sin deportivos ni versiones de prestaciones, sin ultralujo, sin
comerciales ni cuadriciclos: anclar la aceleración en un superdeportivo no
informa de nada sobre un SUV familiar. El universo lo declara el ADR 0010 una
sola vez, y no se redecide eje a eje.

**Cuando existe una distribución publicada, los extremos ya están dados.** El
índice de fiabilidad de la OCU va de 64 a 93 sobre 39 marcas: anclar ahí no
exige justificar por qué se recorta, porque no se recorta nada. Es el mejor
caso posible y conviene buscarlo antes de inventar nada.

**Una magnitud puede quedar fuera del criterio, con su razón declarada.** El
precio de compra en `coste` ancla su 0 en el presupuesto del comprador, no en
el coche más caro del mercado: es el techo duro de esta compra concreta, y
re-anclarlo al mercado dejaría al eje sin nada que decir sobre lo que cuesta
el coche. Una preferencia sin referente externo —la estética— tampoco tiene
mercado contra el que anclarse, y el ADR 0010 no le aplica.

### Entre anclajes: la curva en S

```text
t    = posición entre anclajes, 0 en el bueno y 1 en el malo
nota = 10 × (1 − t²(3 − 2t))
```

Cero parámetros que ajustar, pendiente nula en los dos anclajes y máxima en el
centro. Traduce dos intuiciones a la vez: afinar cerca del extremo bueno no
compra casi nada, y estar cerca del extremo malo es casi tan malo como
estarlo. La zona intermedia es donde se juega la decisión y es donde la curva
discrimina.

**No siempre aplica.** Cuando el dato de entrada ya es un juicio humano de 1 a
5, la compresión de los extremos la aplica la persona al puntuar, y meter una
S encima deforma dos veces el mismo juicio. Ahí la traducción es lineal.

## 3. Combinar magnitudes dentro de un eje

**Los pesos declarados solo significan lo que dicen si cada sumando se
normaliza antes de mezclarse.** Es la lección más cara de la calibración
inicial: `diario` declaraba `0,6 × anchura + 0,4 × longitud` sumando
milímetros con milímetros, y como la longitud varía seis veces más que la
anchura entre los candidatos, la influencia real era **19% / 81%** — casi la
inversa de lo declarado. El modelo decía que le importaba el ancho y calculaba
que le importaba el largo.

Que dos magnitudes sean conmensurables —milímetros y milímetros— **no basta**.
Lo que decide es el recorrido de cada una, no su unidad.

Cuando el reparto entre magnitudes se puede **derivar** en vez de elegir a
ojo, se deriva y se escribe la cuenta. En `coste`, el 50/50 sale de que los
recorridos de las dos escalas cubren la misma cantidad de dinero en un
horizonte de doce años; si alguien mueve un anclaje, el peso se recalcula con
esa misma cuenta.

## 4. ¿Mide el eje lo que dice medir?

Un eje puede estar perfectamente calibrado y medir otra cosa. Pasó con
`viaje`, el de mayor peso del modelo.

**La comprobación:** correlacionar el eje contra los datos objetivos que ya
están en el catálogo, y contra los otros ejes.

| Correlación | r |
| --- | --- |
| viaje ↔ maletero | **+0,08** |
| viaje ↔ estética interior | **+0,77** |
| viaje ↔ precio | +0,63 |

El eje de espacio no tenía **ninguna** relación con la única medida de espacio
del catálogo, y sí una fuerte con lo bonito que parecía el interior. Los tres
maleteros más grandes sacaban la nota más baja. En la práctica, el aspecto del
interior pesaba cerca de un tercio del total bajo dos nombres distintos.

Merece la pena hacerla **antes** de calibrar: calibrar un eje que mide otra
cosa es afinar el instrumento equivocado.

Con pocos candidatos y pocos niveles en uso la correlación es tosca, y hay que
decirlo. Pero una señal así de fuerte no necesita estadística fina para
justificar que se mire el eje con calma.

### Ejes medidos y ejes juzgados

No todo eje debe objetivarse, y confundirlo lleva a trabajo inútil:

- **Si el eje afirma algo sobre el mundo** —cabe el equipaje, va cómodo
  atrás—, se mide. El mundo se mide, y un juicio sobre fotos de catálogo es un
  proxy peor que una cifra con fuente.
- **Si el eje es una preferencia** —me gusta cómo es—, se juzga y no se ancla
  contra nada externo, porque no hay referente externo del gusto. Un 5 en
  estética significa «tan guapo como hace falta» y es autocontenido.

`estetica` es del segundo tipo y debe seguir siéndolo. `viaje` era del segundo
por accidente y pasó al primero.

## 5. Dónde viven los anclajes

Los anclajes de un eje nacen en su spec, **y una spec es un delta que se
congela al consolidar**. Al consolidar hay que llevarse a
`docs/estado/dominio.md` no solo la fórmula, sino **los anclajes y el
razonamiento de cada uno**: de dónde sale ese número, qué modelo de referencia
lo fija y qué se descartó.

Si eso no se hace, dentro de seis meses los anclajes serán constantes sin
explicación y nadie se atreverá a moverlos, que es exactamente la situación
que este documento existe para evitar. Un anclaje sin porqué legible en un doc
de estado es un número mágico, aunque en su día se razonara.

Los anclajes **no son un supuesto global editable** desde el panel de la
aplicación: cambiarlos es una decisión razonada, no un deslizador. Los pesos
sí lo son, y no se confunden con esto.

## 6. El catálogo que alimenta las escalas

Con normalización relativa, un dato flojo movía posiciones. Con escalas
absolutas **va directo a la nota**, así que la calidad del catálogo pasa a ser
parte de la calidad del modelo.

- **Todo valor declara su fuente.** `SourcedNumber` lo impone y Zod lo valida:
  exactamente una fuente vigente, y su valor coincide con el del campo.
- **Un valor estimado se marca como estimado**, y se dice en qué zona de la
  escala cae. Un estimado en la zona plana de la curva es inocuo; en la
  pendiente máxima, no.
- **Corregir un valor no es sobrescribirlo.** El valor anterior se conserva
  como fuente **descartada, con `discardedReason`** diciendo por qué dejó de
  valer. Así se distingue una corrección con motivo de un cambio de opinión
  sin registrar, y se puede auditar de dónde venía un número raro.
- **Un dato por versión, no por modelo.** Media de las correcciones del
  catálogo salieron de mezclar versiones: el maletero del enchufable no es el
  del térmico, y la garantía comercial no es la extensión condicionada a
  mantenimiento en red oficial.
