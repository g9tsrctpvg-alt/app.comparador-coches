# 0010 — Los anclajes de escala son los extremos del mercado, no umbrales de utilidad

- **Estado:** approved
- **Fecha:** 2026-08-23
- **Nivel:** 🟡

## Contexto

El ADR 0004 decidió que cada eje se puntúa contra una escala absoluta, con dos
anclajes fijos: el valor a partir del cual la cosa deja de mejorar (nota 10) y
el valor a partir del cual es inaceptable (nota 0). Fijó el principio, no los
números, y dejó explícitamente que «la escala concreta de cada eje se decide
eje a eje, en su propia spec».

Al aplicarlo seis veces, entre `product/0002` y `product/0007`, cuajó un
criterio para elegir esos números que hoy está escrito en
`docs/proceso/calibracion-de-escalas.md` §2: **el 10 es «a partir de aquí deja
de mejorar», no «lo mejor que existe»; el 0 es «a partir de aquí es
inaceptable», no «lo peor imaginable»**. Y un criterio de control sobre el
resultado: si los candidatos quedan todos apiñados cerca de un extremo, el
anclaje de ese extremo está mal puesto.

Ese criterio de control se aplicó de verdad y movió números. El 0 de anchura
se dejó en 2.000 mm en vez de anclarlo en algo verdaderamente inmanejable
«porque habría dejado a los once candidatos entre 9,1 y 9,9». El 10 de
prestaciones se subió a 145 CV/t y 6,5 s porque una escala más blanda «dejaba
a seis de los once candidatos por encima de 9,7».

El resultado es un conjunto de anclajes que **no dependen del catálogo para
calcularse** —eso lo garantiza el ADR 0004 y se cumple— pero que **sí se
eligieron mirando dónde caían los candidatos**. Es una dependencia distinta y
más sutil: la nota de un coche no cambia si entra otro coche en la lista, pero
los anclajes se colocaron donde separaban bien a los once de entonces. En la
práctica, la escala está centrada en la gama que se estaba mirando.

Eso tiene dos consecuencias que hoy molestan:

- **El 10 no significa lo que dice.** Un 10 en maletero son 620 litros, que es
  el maletero de un SUV medio grande. En el mercado hay 910 litros a la venta.
  Un coche que saca 10 no es que ya no pueda mejorar: es que ya no mejora
  *dentro de la franja que se estaba comparando*.
- **La escala se queda vieja al cambiar la gama.** Cada vez que entra al
  catálogo un coche fuera de la franja original —y han entrado— los anclajes
  elegidos para separar a los once anteriores se quedan descolocados. El
  IONIQ 5 ya supera el anclaje de 10 en anchura de hombros, que estaba puesto
  en un Škoda Superb.

La razón por la que en su día se apretaron los anclajes contra la gama era
**conservar poder de discriminación**: con anclajes anchos, coches parecidos
sacan notas parecidas y el ranking se aplana. Pero el modelo ya tiene una
herramienta para decidir cuánto separa cada eje, y son **los pesos**. Apretar
además la escala es hacer ese trabajo dos veces, en un sitio donde no se ve.

## Decisión

**Los dos anclajes de una escala son los extremos del mercado real de venta al
público**, medidos sobre modelos concretos con fuente publicada, y no un
umbral de utilidad elegido para que los candidatos se repartan bien.

- El **anclaje de 10** es el mejor valor que se puede comprar hoy en ese
  mercado. Un 10 significa «no hay nada mejor a la venta», no «a partir de
  aquí ya me da igual».
- El **anclaje de 0** es el peor valor que se puede comprar hoy en ese
  mercado. Un 0 significa «lo peor que hay a la venta», no «inaceptable».
- Entre ambos, la nota dice **en qué parte del mercado cae el coche**.

**El mercado que fija los extremos** es el turismo generalista de venta al
público en España: entra desde el utilitario más pequeño hasta el SUV grande y
la berlina premium. Quedan fuera, por no ser el mercado en el que se compra un
coche de uso familiar:

- deportivos y superdeportivos, y las versiones de prestaciones de un modelo
  normal (distintivos GT, N, RS, M, AMG y equivalentes);
- ultralujo (Rolls-Royce, Bentley y equivalentes);
- vehículos comerciales y sus derivados de pasajeros;
- cuadriciclos ligeros y pesados (Citroën Ami, Fiat Topolino y equivalentes).

Cuando una magnitud tiene una **distribución publicada** —el índice de
fiabilidad de la OCU— los extremos ya son los del mercado y no hay nada que
decidir: se usan tal cual, como ya se venía haciendo.

Cuando una magnitud **no es una afirmación sobre el mundo sino una
preferencia** —la estética, que el usuario puntúa de 1 a 5— no hay mercado
contra el que anclarla y este ADR no le aplica: sigue siendo autocontenida.

**El reparto de importancia entre ejes lo hacen los pesos, y solo los pesos.**
Que los candidatos queden apiñados en un eje deja de ser motivo para mover un
anclaje: es información correcta —«en esto todos estos coches son
parecidos»— y quien decide cuánto pesa esa información es el peso del eje.

## Alternativas consideradas

- **Mantener el criterio de utilidad del ADR 0004 tal como se venía
  aplicando** (el 10 es «deja de mejorar»). Es lo que hay, produjo anclajes
  defendibles y conserva más separación entre candidatos. Se descarta porque
  el umbral de utilidad es en la práctica indistinguible de «lo que separa
  bien a los coches que estoy mirando»: las dos veces que se movió un anclaje
  por este criterio, el argumento escrito fue dónde caían los candidatos, no
  qué deja de mejorar. Un criterio que en cada aplicación real se resuelve
  mirando el catálogo no es independiente del catálogo.

- **Anclar en el mercado completo, incluidos deportivos y ultralujo.** Es el
  extremo coherente de esta misma decisión y no exige trazar ninguna frontera
  discutible. Se descarta porque el mercado en el que se compra un coche
  familiar no incluye un superdeportivo: anclar el 10 de aceleración en 2,8 s
  no informa de nada sobre un SUV híbrido, y además obliga a mantener al día
  una cifra que ninguna decisión de compra va a usar.

- **Anclar en el segmento del coche** (los extremos de los SUV medios, para un
  SUV medio). Da la máxima separación entre candidatos y las notas más
  intuitivas. Se descarta porque rompe la invariante que sostiene todo el
  modelo: un 5 en un eje tendría que significar lo mismo que un 5 en otro, y
  con escalas por segmento significaría «medio dentro de su clase», que es
  otra vez una nota relativa —la misma que el ADR 0004 quitó— solo que con el
  conjunto de referencia escondido en la palabra «segmento».

- **Ensanchar los anclajes y pasar de la curva en S a una recta** para no
  perder separación al ensanchar. Se descarta aquí por ser una decisión
  distinta: la forma de la curva la fija el ADR 0004 y tiene su propio
  razonamiento —afinar cerca del extremo bueno no compra casi nada—, que este
  ADR no revisa. Queda como consecuencia observada, abajo.

## Consecuencias

- **Las notas bajan, en bloque.** Con los anclajes de mercado, ningún
  candidato del catálogo pasa de 7 en `diario` ni de 7 en `viaje`, y en CV por
  tonelada todos caen por debajo de 5. Es el efecto buscado: son coches
  normales medidos contra todo lo que se vende, no contra sus vecinos.

- **El ranking cambia poco en la cabeza y bastante en la mitad de la tabla.**
  Los dos primeros no se mueven. Lo que se mueve es lo que estaba empatado por
  compresión de escala.

- **Se pierde separación dentro de cada eje.** Al ensanchar el recorrido, la
  zona de máxima pendiente de la curva en S se aleja de donde están los
  candidatos, y las distancias entre ellos se encogen —del orden de un tercio
  a la mitad, medido sobre el catálogo actual—. Es el coste asumido, y el
  contrapeso son los pesos. **Disparador para revisarlo:** que un eje con peso
  alto deje de ordenar a los candidatos —todos dentro de menos de un punto—,
  en cuyo caso lo que se revisa es la forma de la curva, no el anclaje.

- **Los anclajes hay que mantenerlos.** Un anclaje que dice «lo mejor que se
  vende» caduca cuando sale algo mejor, mientras que un umbral de utilidad no
  caducaba. **Disparador:** al dar de alta un coche que supere un anclaje de
  10 o empeore uno de 0, se revisa ese anclaje en vez de dejar que el catálogo
  sature la escala.

- **Los anclajes siguen sin ser un supuesto global editable.** Cambian por
  spec razonada, como hasta ahora. Que ahora se deriven del mercado no los
  convierte en un deslizador del panel.

- **El ADR 0004 no queda sustituido.** Sigue vigente entero: escalas
  absolutas, dos anclajes, la nota satura fuera de ellos y añadir un candidato
  no mueve la nota de los demás. Este ADR solo decide **con qué criterio se
  eligen esos dos números**, que es justo lo que el 0004 dejó abierto.

## Historial

- **2026-08-23 — Creación.** Nace al detectar que el criterio de elección de
  anclajes escrito en `calibracion-de-escalas.md` §2 se resolvía en la
  práctica mirando dónde caían los candidatos, y que eso duplica el trabajo de
  los pesos. Nivel 🟡: es modelado de dominio, se propone y se valida.
