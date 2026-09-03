# 0012 — La ausencia de prueba se puntúa con un neutro declarado

- **Estado:** draft
- **Fecha:** 2026-09-03
- **Nivel:** 🟡

## Contexto

Los siete ejes de hoy comparten una propiedad que nunca hizo falta escribir:
**su entrada existe siempre, para todos los candidatos**. Las magnitudes con
fuente son obligatorias y `loadCatalog` rechaza el catálogo entero si a un
registro le falta una; las dos valoraciones de estética son `UserRating`, sin
fuente, pero vienen rellenas en `cars.json` para los veintiún registros. Un
coche sin dato en un eje no es un caso raro: es un catálogo inválido.

La propuesta P6 del roadmap —anotar por coche lo que solo se sabe sentado
dentro, y que pese en la nota— rompe eso por primera vez. Su entrada no se
puede buscar, estimar ni citar: aparece cuando alguien conduce el coche. Y
nadie conduce dieciocho. Lo normal es probar tres o cuatro de la lista corta,
tarde, y decidir con quince candidatos sin probar en la misma tabla.

De ahí la pregunta que este ADR contesta: **¿qué nota saca en ese eje un
coche que todavía no se ha probado?** No es una pregunta de interfaz. El
ADR 0004 hizo que una nota signifique algo por sí sola —un 5 quiere decir
«del montón», no «quinto de dieciocho»—, y cualquier respuesta aquí decide
qué significa la nota de ese eje para la mayoría de la tabla.

## Decisión

**La ausencia de un juicio de primera mano se puntúa con un neutro
declarado, y el neutro se rotula siempre.**

1. **Un coche sin probar saca la nota media de la escala del eje: 5,0.** Es
   un valor declarado y constante, exactamente equivalente a contestar 3 —el
   punto medio— a las cinco preguntas de la prueba. No se excluye el eje de
   su total, no se estima a partir de los otros ejes y no se le pide a nadie
   que complete nada.
2. **Un registro parcial se completa con el mismo neutro, pregunta a
   pregunta.** Quien conteste tres de los cinco juicios tiene los otros dos
   en 3. No hay diferencia de mecanismo entre «no lo he probado» y «no me
   fijé en eso»: las dos son la misma ausencia, y se puntúan igual.
3. **La nota no carga sola con la distinción: la interfaz la rotula.** Un 5,0
   en este eje significa dos cosas distintas —«no lo has probado» y «lo
   probaste y te pareció del montón»— y el número no las separa. Toda
   superficie que muestre esa nota dice de cuál de las dos se trata; una
   superficie que no pueda rotularla no muestra la nota.
4. **Un eje cuya entrada depende de un acto del usuario nace con peso 0.**
   El día que se añade, la clasificación no se mueve ni un dígito, porque el
   neutro mayoritario no puede desordenar nada mientras el eje no pese.
   Subirlo es un acto explícito de quien decide, no un efecto de haber
   guardado una prueba.
5. **La regla es general, no un caso particular de la prueba real.**
   Cualquier eje futuro cuya entrada sea un acto del usuario —una prueba de
   carga, una visita a un taller— se rige por los cuatro puntos de arriba.

## Alternativas consideradas

- **Excluir el eje del total de quien no lo ha probado**, dividiendo cada
  coche por la suma de los pesos que sí le aplican. Es la respuesta que
  parece más honesta y es la peor: los totales dejan de ser comparables entre
  sí, el reparto de la diferencia de `product/0029` deja de sumar la
  diferencia que reparte, y el supuesto que introduce está escondido —«al
  coche sin probar se le supone su propia media en los demás ejes»— en vez de
  declarado. Cambia una suposición visible por otra invisible.
- **Puntuar 0 al no probado.** Convierte la clasificación en el orden en que
  se han hecho las visitas: el coche que nadie ha ido a ver se hunde por no
  haber sido visitado, que es justo lo contrario de para qué sirve un
  comparador que ayuda a decidir a quién ir a ver.
- **Puntuar 10 al no probado.** El error simétrico: premia lo desconocido, y
  probar un coche solo puede perjudicarlo.
- **Estimar la nota a partir de otros ejes** —habitabilidad, carga,
  estética—, para que el hueco no sea un hueco. Es exactamente el fallo que
  `product/0005` sacó del eje `viaje`: una valoración que decía medir el
  espacio y acababa midiendo lo bonito que parecía el interior en las fotos
  (r = 0,77 con la estética, r = 0,08 con el maletero). Inventar el dato que
  falta a partir de los que hay reproduce ese fallo con otro nombre.
- **No dejar que el eje cuente hasta haber probado todos los candidatos.**
  Es coherente y es inusable: hay dieciocho candidatos publicados y se
  prueban tres o cuatro. El eje no contaría nunca.
- **Que la prueba se anote pero no puntúe**, como el estado de decisión de
  `product/0030`. Es la opción conservadora y no hace falta descartarla por
  ningún defecto técnico: descarta el objetivo de P6, que es explícitamente
  que lo que solo se sabe sentado dentro pese en la nota. Queda como el
  camino de vuelta si el eje resulta hacer más ruido que bien.
- **Mostrar la incertidumbre como banda de nota** en vez de como rótulo, que
  es la propuesta P11 del roadmap. Está `en espera` por su propio motivo y
  es bastante más cara: exige que toda la interfaz sepa mostrar intervalos.
  El rótulo resuelve el mismo problema aquí y ahora, y no cierra esa puerta.

## Consecuencias

- **Un 5,0 en un eje de este tipo es ambiguo por diseño**, y desambiguarlo
  pasa a ser obligación de la interfaz. Es deuda de disciplina: una vista
  nueva que enseñe la nota sin el rótulo introduce un error que el dominio no
  puede detectar por ella.
- **Probar un coche solo lo mueve respecto al neutro.** Ir a verlo y salir
  decepcionado lo baja, y eso es correcto: la prueba es información en las
  dos direcciones, no una recompensa por haber ido.
- **Con el eje pesando, los coches probados que gustaron adelantan a los no
  probados.** Es lo que P6 pide y se acepta a sabiendas. Queda **aplazado con
  disparador**: si alguna vez un coche pierde el liderato **solo** por llevar
  el neutro —esto es, si probarlo lo devolvería al primer puesto—, se retoma
  P11 y la nota de este eje pasa a mostrarse como banda.
- **El ADR 0004 sigue intacto.** El neutro es un valor declarado, constante y
  externo al conjunto de candidatos: no depende de qué otros coches haya ni
  de cuántos se hayan probado. Añadir o quitar candidatos no mueve ninguna
  nota, igual que antes.
- **El ADR 0009 sigue intacto.** La prueba lleva fecha, se muestra y se
  compara, pero ninguna fórmula la lee: la nota de un coche probado en marzo
  es la misma en diciembre.
- **El peso 0 de partida hace verificable la llegada del eje**: la
  clasificación de todo el catálogo tiene que quedar bit a bit igual el día
  que se implementa, y eso se comprueba contra el snapshot que ya existe.

## Historial

- **2026-09-03 — creación.** Redactado junto a `product/0037`, que registra
  la prueba real y genera la hoja de visita. La pregunta de fondo —qué
  puntúa un eje cuya entrada todavía no existe para la mayoría de la tabla—
  no cabía dentro de la spec: gobierna cualquier eje futuro que dependa de un
  acto del usuario, y por eso se decide aquí.
