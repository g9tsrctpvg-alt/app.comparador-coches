# 0011 — Una preferencia identifica la clasificación, no los pesos

- **Estado:** approved
- **Fecha:** 2026-09-01
- **Nivel:** 🟡

## Contexto

El ADR 0004 puso los siete ejes en escala absoluta, y de ahí sale una
propiedad que no se buscaba: **la nota de un eje no depende de los pesos**.
Comprobado sobre el catálogo, no supuesto — puntuando los dieciocho coches
publicados con dos vectores de pesos deliberadamente opuestos, la diferencia
máxima entre las notas de eje resultantes es exactamente 0. El peso solo
multiplica.

La consecuencia es que «prefiero este coche a ese» **es exactamente una
desigualdad lineal sobre los siete pesos**:

```text
Σ pesoᵢ × (notaᵢ(A) − notaᵢ(B)) > 0
```

Sobre esa propiedad se apoya `product/0035`, que deduce los pesos de una
tanda de elecciones cara a cara. Y al redactarla apareció la pregunta que
este ADR contesta: **¿qué se puede afirmar de verdad al terminar la tanda?**

La expectativa natural —la que sugiere el nombre «preferencia revelada»— es
que con bastantes respuestas se acaban sabiendo los pesos de quien contesta.
Es falsa, y no por poco:

- **Por escala.** Si un vector de pesos explica todas las respuestas,
  multiplicarlo por dos también las explica: la desigualdad es homogénea.
  Uno de los siete números nunca se determina, pase lo que pase.
- **Por forma.** Cada respuesta recorta un semiespacio. Una cantidad finita
  de semiespacios que pasan todos por el origen delimita un **cono convexo**,
  no un punto. En el espacio continuo de pesos, el conjunto de explicaciones
  compatibles **nunca** se reduce a una: no es que haga falta preguntar más,
  es que no existe tanda que lo consiga.

Y sin embargo la clasificación **sí** queda fijada, porque es justo lo que las
respuestas son. Medido el 2026-09-01 sobre los dieciocho coches publicados,
con sesenta perfiles de preferencia sintéticos:

- De partida, recorriendo las **78.124** combinaciones enteras de la rejilla
  `{0, 2, 5, 8, 10}` por eje, **trece de los dieciocho coches llegan a ser
  líderes** con alguna de ellas, y **ninguno de los 153 enfrentamientos está
  decidido de antemano**. La clasificación que se ve en pantalla es una de
  muchas.
- Al terminar una tanda —que se cierra sola en 14 a 18 preguntas—, la
  combinación propuesta reproduce el **97,1 %** de los 153 enfrentamientos
  del perfil real y acierta su líder el **81,7 %** de las veces, frente al
  **81,2 %** y **33,3 %** de los pesos por defecto.
- Y aun así los siete números **rara vez coinciden**. En una sesión de
  ejemplo, un perfil cuyos pesos verdaderos son exactamente los de por
  defecto (`5,5,7,5,7,6,5`) recibe la propuesta `5,8,10,5,10,8,5`: números
  distintos, mismo líder, 96,7 % de los enfrentamientos iguales. El vector
  verdadero ni siquiera está en la rejilla —7 y 6 no son niveles—, y no hace
  falta que lo esté.

Esa última medida es la que ordena el problema. **Lo que la tanda averigua es
el orden; los pesos son solo la forma de escribirlo.** Decidir cómo se calcula
y qué se enseña sin haber decidido antes esto lleva a prometer una medida de
la persona que el método no puede dar.

## Decisión

**Una tanda de preferencias identifica la clasificación, no los pesos.** De
ahí, cuatro decisiones:

1. **La aplicación nunca presenta los pesos derivados como una medida de
   quien contesta.** Son *una* explicación de lo respondido, no *la* medida
   de lo que esa persona valora, y así se dicen.

2. **El avance y el resultado se expresan en unidades de resultado, no de
   peso**: cuántos coches pueden todavía ser el primero, cuántos de los
   enfrentamientos posibles han quedado decididos, y cuántas combinaciones
   siguen siendo compatibles. Son cantidades que cambian lo que se ve, y
   además se estrechan de verdad conforme se contesta.

3. **Se razona por enumeración sobre una rejilla declarada y finita**, no con
   un ajuste continuo. Cada peso toma valor en `{0, 2, 5, 8, 10}`, lo que da
   `5⁷ = 78.125` combinaciones menos la nula: **78.124**. El recorrido es
   siempre el mismo, sin muestreo ni semilla, así que dos ejecuciones con las
   mismas respuestas dan el mismo resultado bit a bit. Como la respuesta
   buscada es un orden y no un punto, una rejilla gruesa basta, y todos sus
   valores son enteros de 0 a 10: **cualquier resultado es representable en
   los deslizadores tal como están**.

4. **Los pesos propuestos son un representante declarado del conjunto
   compatible**, elegido por una regla determinista y publicada —la
   combinación del conjunto compatible más cercana al centro de ese mismo
   conjunto (`product/0036`)—, no por una precisión que no existe. La regla
   concreta puede corregirse sin reabrir esta decisión: lo que fija esta
   decisión es que exista una regla así, determinista y publicada, no cuál.

Lo que **no** se decide aquí: cómo se elige la siguiente pregunta, cuándo
termina la tanda, qué se enseña de cada coche y dónde vive el diálogo. Eso es
el cambio concreto y vive en `product/0035`.

## Alternativas consideradas

- **Ajustar los pesos con un método continuo** —regresión logística,
  Bradley-Terry, máximo margen con un solver—. Es lo que haría cualquiera que
  reconozca el problema como clasificación lineal. Se descarta por tres
  motivos que se refuerzan: obliga a una dependencia nueva o a escribir un
  optimizador, mete hiperparámetros que habría que justificar uno a uno, y
  **no cambia el hecho de fondo** —el conjunto compatible sigue siendo un
  cono—, así que devuelve un punto con decimales que aparentan una precisión
  que no existe. Encima ese punto habría que redondearlo al paso 1 del
  deslizador, deshaciendo por la puerta de atrás la precisión que se pagó.

- **Descenso coordinado sobre la rejilla entera de enteros 0-10** (`11⁷`).
  Se implementó y se midió antes de descartarlo: encuentra siempre una
  combinación que satisface todas las respuestas —acierto sobre lo
  respondido, 1,000 con quince respuestas o menos—, pero al ser el problema
  invariante de escala el vector **baila** de una pregunta a la siguiente. En
  una sesión medida pasó de `10,10,10,3,9,10,10` a `6,9,7,4,4,5,5` con una
  sola respuesta más. Enseñar eso en vivo sugiere que el método es
  inestable, cuando lo inestable es la pregunta mal planteada. Se descarta:
  no aporta nada sobre la rejilla declarada y cuesta un optimizador con sus
  mínimos locales y sus reinicios.

- **Una rejilla más fina**, de siete niveles por eje (`823.542`
  combinaciones). Medida contra la de cinco niveles a igualdad de preguntas
  —veinte—: **98,2 %** de acuerdo frente al **97,0 %**. Se descarta: 1,2
  puntos porcentuales por diez veces el trabajo, en una cifra que además no
  es el objetivo —el líder se acierta igual—.

- **Declarar un rango por peso** («tu `coste` está entre 6 y 10»). Es la
  forma obvia de ser honesto sobre lo que falta por saber, y se probó. Se
  descarta **con medición**: con la definición honesta de compatibilidad
  —sin exigir margen— los rangos no se estrechan; al final de una tanda
  completa siguen cubriendo casi todo el recorrido `0-10` de casi todos los
  ejes, porque el conjunto compatible es un cono. Es una lectura honesta y
  a la vez inútil como indicador de avance: diría «no sé nada» justo cuando
  la clasificación ya está decidida. Los rangos solo parecían estrecharse
  cuando se exigía un margen mínimo artificial, y entonces lo que se estaba
  midiendo era el margen, no lo que las respuestas fijan.

- **Seguir preguntando hasta fijar los pesos.** No es caro: es imposible, por
  el argumento del cono. Se descarta como objetivo, no como esfuerzo.

- **Enseñar los siete números y callar lo demás.** Es lo más simple y lo que
  la propuesta P5 sugería literalmente. Se descarta porque es exactamente la
  falsa precisión que este proyecto no publica: siete enteros presentados sin
  matiz se leen como un perfil personal medido, y no lo son.

## Consecuencias

- **`product/0035` cierra su única decisión abierta** y enlaza este ADR. Su
  requisito 5 (los pesos propuestos), su requisito 9 (el avance) y su
  requisito 10.2 (qué se dice del resultado) son la aplicación directa de lo
  decidido aquí.

- **La interfaz gana dos cifras y pierde una promesa.** Gana «cuántos coches
  pueden todavía ser el primero» y «cuántos enfrentamientos han quedado
  decididos»; pierde la lectura de «estos son tus pesos». Es un peor titular
  y una mejor afirmación.

- **Dos personas con el mismo criterio pueden recibir números distintos.**
  `product/0036` corrigió el desempate original —por cercanía a los pesos
  vigentes, que en la práctica no llegó a activarse nunca— por el centro del
  propio conjunto compatible, y ahí también puede haber empate: dos
  combinaciones igual de cercanas al centro se deciden por el orden de
  recorrido de la rejilla, no por ninguna preferencia entre ellas. Es
  coherente con lo decidido —no hay un valor verdadero que recuperar— y es la
  razón por la que ese desempate se declara en vez de esconderse.

- **Sobre la rejilla, el conjunto compatible sí puede quedarse en una sola
  combinación**, y en el ejemplo medido se quedó. No es identificación: es
  que la rejilla es gruesa y el vector verdadero no estaba en ella. La
  afirmación del punto 1 de la decisión no se relaja por eso; si acaso, ese
  caso es el que más la necesita.

- **El coste está acotado y medido**: recorrer las 78.124 combinaciones
  contra diecisiete respuestas son 57,5 ms, y la rejilla cabe en un
  `Uint8Array` de 547 KB o se genera al vuelo. Ni una dependencia nueva.

- **La rejilla vale mientras los ejes sean siete y la nota sea lineal en los
  pesos.** Ambas cosas son ciertas hoy y ninguna es eterna. **Disparador:**
  que se añada un octavo eje —`5⁸ = 390.625` combinaciones, cinco veces el
  trabajo— o que la nota deje de ser lineal en los pesos; en cualquiera de
  los dos casos se revisa el tamaño de la rejilla, y en el segundo, el método
  entero.

- **Queda fuera, aplazado, dar a la nota una banda por incertidumbre de
  pesos** —cuánto puede moverse la nota de un coche dentro del conjunto
  compatible—. Es una consecuencia natural de este ADR y una decisión
  distinta, con su propio coste en pantalla. **Disparador:** que alguien
  pregunte cuánto de la nota que ve depende de los pesos que eligió. No
  confundir con la propuesta P11 del roadmap, que es incertidumbre de los
  **datos** y sigue en espera por su cuenta.

- **El ADR 0004 no queda tocado.** Este ADR se apoya en él —sin escalas
  absolutas no habría desigualdad lineal— y no revisa ni un anclaje ni una
  curva. Tampoco toca el ADR 0010: de dónde salen los anclajes es otra
  pregunta.

## Historial

- **2026-09-01 — Creación.** Nace de la decisión abierta que dejó
  `product/0035` al redactarse: si la rejilla declarada y el hallazgo de que
  lo identificado es la clasificación y no los pesos merecían registro
  propio. Se decide que sí, porque las dos sobreviven a la implementación de
  esa spec y ninguna es reversible sin rehacerla entera. Nivel 🟡: es
  modelado de dominio, se propone y se valida. Todas las cifras citadas
  proceden de la medición hecha al redactar `product/0035`, sobre los
  dieciocho coches publicados con `DEFAULT_ASSUMPTIONS` y el presupuesto por
  defecto.
- **2026-09-02 — Corrección de la decisión 4.** Al usar la tanda por primera
  vez sobre el despliegue real, el criterio de «mayor margen mínimo» resultó
  ser extremo con pocas respuestas —maximizar un margen sobre un conjunto que
  es un cono, la decisión 1 de este mismo ADR, siempre cae en una esquina—, y
  su desempate por cercanía a los pesos vigentes no llegó a activarse ni una
  vez en cuarenta sesiones medidas. `product/0036` corrige la regla:
  representante = combinación más cercana al centro del conjunto compatible,
  sin ese desempate. La decisión 4 y la consecuencia sobre empates se
  reescriben para describir la regla vigente; el resto del ADR —el porqué,
  las alternativas, las demás consecuencias— no cambia.
