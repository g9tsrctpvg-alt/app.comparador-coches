# 0004 — Puntuación en escala absoluta, no relativa al conjunto

- **Estado:** approved
- **Fecha:** 2026-08-04
- **Nivel:** 🟡

## Contexto

Todos los ejes puntúan hoy **relativo al conjunto de candidatos**: se busca
el mínimo y el máximo entre los once coches, el peor se lleva un 0, el mejor
un 10, y el resto se reparte linealmente entre ambos. La nota de un coche no
dice si el coche es bueno; dice **en qué puesto va** dentro de esta lista
concreta.

Ese esquema viene de los rankings competitivos, donde tiene sentido: los
participantes pueden mejorar, y estirar la escala premia al que se esfuerza.
Aquí no aplica. **Los coches no compiten ni pueden mejorar**: sus medidas son
las que son, y la lista es una selección arbitraria de once modelos que
alguien decidió mirar.

De ahí salen tres problemas concretos, medidos sobre el catálogo real:

**Amplifica diferencias irrelevantes.** En el eje de uso diario, la anchura
de los once candidatos va de 1802 a 1866 mm — 64 mm de diferencia entre el
más estrecho y el más ancho, menos de lo que mide un puño. La normalización
relativa estira esos 64 mm sobre toda la escala 0-10, de modo que el coche
más estrecho saca un 10 y el más ancho un 0 como si fueran mundos aparte.

**Esconde que todos son mediocres.** Con anclajes absolutos razonables, esos
mismos once coches caen entre 3,2 y 5,6 sobre 10 en uso diario: son todos
tirando a incómodos para ciudad y bastante parecidos entre sí. La escala
relativa borra ese hecho y presenta al menos malo como si fuera bueno.

**Oculta al candidato equilibrado.** Un coche razonablemente bueno en los
seis ejes, sin ser el mejor en ninguno, queda a media tabla en todos y su
puntuación total lo entierra. Y al revés: un coche mediocre gana un eje
entero por ser el menos malo en algo que a nadie le importa.

Hay además un efecto de segundo orden. Al garantizar que **todo** eje ocupa
el rango 0-10 completo, la escala relativa le da a cada eje el mismo poder de
discriminación, difieran los candidatos mucho o nada en él. Los pesos dejan
de significar lo que dicen: no ponderan la importancia del eje, ponderan la
importancia del eje **multiplicada por lo dispersos que estén los candidatos
en él**.

## Decisión

Cada eje se puntúa contra una **escala absoluta propia**, fijada por juicio
explícito y estable, no derivada del conjunto de candidatos.

Una escala declara dos anclajes: el valor a partir del cual la cosa deja de
mejorar (nota 10) y el valor a partir del cual es inaceptable (nota 0). Entre
ambos la nota interpola; fuera de ambos satura. Los anclajes se eligen contra
la realidad del problema —lo que cabe en una plaza de garaje, lo que cuesta
un coche— y **no tienen por qué existir entre los candidatos**: el coche
ideal de un eje puede no estar en la lista, y el inaceptable tampoco.

Una escala solo cambia cuando un razonamiento explícito la cambia. Añadir,
quitar o editar un candidato **no altera ninguna nota de los demás**.

La escala concreta de cada eje —sus anclajes y su forma— se decide **eje a
eje, en su propia spec**. Este ADR fija el principio, no los números.

## Alternativas consideradas

- **Seguir con normalización relativa.** Es lo que hay y no cuesta nada.
  Descartada por los tres problemas de arriba: no es un ajuste fino, es que
  mide otra cosa distinta de la que el comparador dice medir. Un 10 que
  significa «el menos malo de once» no sirve para decidir una compra.
- **Relativa, pero contra un conjunto de referencia más amplio** —todo el
  mercado, o una muestra representativa— en vez de contra los once
  candidatos. Arregla la arbitrariedad de la lista y mantiene el mecanismo.
  Descartada porque exige mantener un catálogo de mercado que nadie va a
  mantener, y porque sigue sin responder la pregunta que importa: no «cuántos
  coches son más estrechos que este», sino «¿es este coche estrecho?».
- **Absoluta pero lineal sin saturación**, con los anclajes como extremos
  duros. Más simple. Descartada porque falsea los extremos: un coche de 1,60
  m no es el doble de cómodo de aparcar que uno de 1,70 — por debajo de
  cierto punto la anchura deja de ser el problema. La saturación recoge eso.
- **Tramos discretos** («menos de 1,75 → 10; de 1,75 a 1,85 → 7; …»).
  Facilísimo de discutir y de defender. Descartada como norma general porque
  crea escalones: un milímetro cambia la nota de golpe, y dos coches
  prácticamente iguales caen en tramos distintos. Queda disponible para un
  eje concreto si su naturaleza lo pide.
- **Normalizar relativo y corregir solo los pesos.** Tentador porque es un
  cambio pequeño. Descartada porque no toca la causa: por mucho que se
  recalibren los pesos, la nota de un coche seguiría cambiando cuando se
  añade otro coche a la lista.

## Consecuencias

- **Una nota pasa a significar algo por sí sola.** «Un 4 en uso diario»
  querrá decir «incómodo tirando a mediano», no «cuarto de once».
- **Las notas dejan de moverse al tocar el catálogo.** Añadir un candidato ya
  no repuntúa a los demás. Hoy sí lo hace, y nadie lo esperaría.
- **Los ejes dejan de tener el mismo poder de discriminación, y eso es lo
  correcto.** Un eje en el que los candidatos apenas difieren influirá poco
  en el total, en vez de fabricar diferencias. `diario`, por ejemplo, pasaría
  de mover 10 puntos entre el mejor y el peor a mover unos 2,4.
- **Coste asumido: los pesos vigentes quedan descalibrados.** Se eligieron
  conviviendo con el comportamiento anterior, donde todo eje estiraba a
  0-10. **Disparador** para revisarlos: que el primer eje migre a escala
  absoluta.
- **Coste asumido: cada eje necesita su juicio.** No hay una regla mecánica
  que produzca los anclajes; hay que pensarlos y defenderlos uno a uno. A
  cambio, quedan escritos y discutibles, en vez de emerger de la lista de
  candidatos sin que nadie los haya decidido.
- **Deja de tener sentido nombrar «qué modelo marca el mínimo y el máximo»**
  de un eje migrado —requisito 6 de `product/0001`—, porque los extremos ya
  no salen del grupo. Lo sustituye mostrar la escala y dónde cae el coche en
  ella. Cada spec de eje lo declara para el suyo.
- **Un coche de referencia pasa a ser útil.** Hoy un modelo que no es
  candidato solo estorbaría; con escalas absolutas sirve para calibrar
  anclajes contra algo conocido de primera mano. Afecta a la deuda de la fila
  del Alfa Romeo Giulietta, hoy fuera del catálogo.
- **La página que explique los cálculos gana importancia.** Con escalas
  absolutas hay algo más que explicar —de dónde sale cada anclaje— y también
  algo más que ganar: la escala es justo lo que hace la nota interpretable.
