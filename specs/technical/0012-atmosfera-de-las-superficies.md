# 0012 — Atmósfera de las superficies

- **Id:** technical/0012
- **Estado:** approved
- **Tipo:** technical
- **Fecha:** 2026-08-15
- **Specs relacionadas:** product/0009, product/0010, technical/0005,
  technical/0006, technical/0009, technical/0011
- **ADRs relacionados:** 0006
- **Doc de estado:** `docs/estado/interfaz.md`

## Contexto

`technical/0011` le dio color a los seis ejes, que es donde el color podía
significar algo. Pero **las superficies siguen siendo grises**: la cabecera es
blanco puro con un pelo gris, el degradado de página va de un neutro casi
imperceptible a otro, la tarjeta del líder es una caja `ink` sin ningún borde
que la despegue, y los siete titulares de sección de `#/como-se-calcula` son
texto en `ink` sin nada más — que es además donde más se nota que `<h2>` no
tiene tamaño propio.

Son las cuatro superficies que se ven **antes** de leer nada, y las cuatro
llegan sin un solo tono.

## Objetivo

Que el gris deje de dominar lo primero que se ve, sin que ninguna de las cuatro
superficies pase a significar algo que antes no significaba.

## Alcance

1. La cabecera de aplicación, con fondo tintado en vez de blanco.
2. El degradado de página, con croma de verdad en el arranque.
3. La tarjeta del líder, despegada del fondo con un canto de acento.
4. Los titulares de sección de `#/como-se-calcula`, con un filete de acento.
5. Los tres estados del conmutador de vista, que la cabecera tintada obliga a
   rehacer (requisito 1.3).

## Fuera de alcance

- **Cualquier color que signifique algo.** Esta spec no toca el color de eje
  de `technical/0011`, ni los papeles de dirección, ni la señal de alerta.
  Aquí el color es atmósfera: si algo de esto se retirara, no se perdería
  ningún dato.
- **La escala tipográfica.** `--font-size-2xl` y `--font-size-lg` siguen sin
  consumidor y siguen anotados como deuda en `docs/roadmap.md`. El filete del
  requisito 4 hace que un titular de sección se distinga, pero **no le da
  tamaño propio**, y esta spec no pretende cerrar esa deuda de refilón.
- **Teñir el fondo de una tarjeta.** Ver el requisito 2.2: el margen de
  contraste del texto apagado no lo permite, y esa es la misma razón por la
  que `technical/0011` retiró sus tintes de eje.

## Requisitos / comportamiento esperado

### 1. La cabecera deja de ser blanca

1.1. `AppHeader` pasa de `--color-card-raised` —blanco puro— a un token nuevo,
`--color-chrome: #e8f0ef`: el acento al 10 % sobre blanco. Es un papel con
nombre por función, como el resto de la paleta: el fondo del cromo de la
aplicación, no «el verde claro».

1.2. Contrastes medidos sobre él: `ink` 13,77:1, `accent` 5,96:1 y `mute`
4,86:1. Los tres pasan el umbral de texto normal, y los tres entran en
`DECLARED_PAIRS`.

1.3. **El conmutador de vista se rehace, porque si no se rompe.** Su pastilla
activa usa hoy `--color-accent-tint`, el acento al 7 %. Sobre una cabecera que
ya es acento al 10 %, ese tinte deja de distinguirse y el conmutador vuelve a
leerse como tres etiquetas planas — justo la regresión que `technical/0009`,
requisito 6.1, arregló. Los tres estados se invierten:

| Estado | Antes | Ahora |
| --- | --- | --- |
| Activo | `--color-accent-tint` | `--color-card-raised` |
| `:hover` | `--color-card-raised` | `--color-accent-tint` |
| `:active` | `--color-accent-tint` | `--color-accent-tint-strong` |

La pastilla activa **se levanta** de un carril tintado en vez de teñirse sobre
uno blanco. Conserva su `--shadow-control` y su texto en acento, así que la
metáfora que ya describe su comentario —«una pieza elegida dentro de un
carril»— se cumple mejor, no peor.

1.4. El pelo inferior de la cabecera pasa de `--color-rule` a
`--color-accent-tint-strong`. No es una línea de dato: separa el cromo del
contenido.

### 2. El degradado de página gana croma

2.1. `--gradient-paper` arranca hoy en `#f3f5f0`, que es un neutro: sobre
`--color-paper` `#eceee9` la diferencia es de luminosidad, no de tono. Pasa a
`#e9f2ee`, un verde muy pálido.

2.2. **El arranque tiene un suelo que no es estético.** El fondo de página
lleva texto de cuerpo encima, y `mute` sobre `paper` está a 4,81:1 — con poco
margen. Cualquier tinte que oscurezca el arranque baja ese número por debajo de
4,5:1: el acento al 5 % sobre `paper` ya lo deja en 4,48:1. `#e9f2ee` da
**4,93:1**, por encima del propio `paper`, así que el degradado añade color
**y** deja el texto mejor de lo que estaba. El sentido del degradado no cambia:
sigue yendo de más claro arriba a `paper` abajo.

### 3. La tarjeta del líder se despega

3.1. `LeaderCard` compone `card` e `invertedSurface`: fondo `ink` sobre un
fondo `paper`, sin nada que marque el canto. Gana un filete de acento a la
izquierda, con el mismo `--size-rule-axis` que `technical/0011` estrenó.

3.2. **Va en un `::before`, no en un `border`.** Es la misma trampa que
`technical/0011` documentó y midió: el primitivo `card` se emite en el CSS
final después que los módulos que lo componen, así que su `border` gana.

### 4. Los titulares de sección tienen filete

4.1. Los siete `<h2>` de `#/como-se-calcula` (`.sectionTitle`) reciben un
filete corto de acento encima. `.sectionTitle` no compone ningún primitivo, así
que aquí un borde sí funciona.

4.2. Esto **no** cierra la deuda de la escala tipográfica: un `<h2>` sigue sin
tamaño propio entre los 40px del título de vista y los 16px del cuerpo. El
filete lo hace localizable, no jerárquico. La deuda sigue anotada.

### 5. Ningún dato depende de esto

5.1. Las cuatro superficies son atmósfera. Ninguna transmite información que no
esté ya en el texto, y retirarlas no dejaría la aplicación ambigua — que es
exactamente lo que las distingue del color de eje de `technical/0011`.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] `--color-chrome` existe en `src/styles/global.css` y sus tres pares
      —`ink`, `accent` y `mute` sobre él— están en `DECLARED_PAIRS`, pasando el
      umbral de 4,5:1.
- [ ] El arranque del degradado da a `mute` **al menos** los 4,81:1 que ya da
      `--color-paper`, comprobado con la misma fórmula del validador.
- [ ] Los tres estados del conmutador de vista son visualmente distintos entre
      sí sobre la cabecera tintada, medido como tres colores de fondo
      calculados distintos.
- [ ] `scripts/validateStyleTokens.ts` sigue pasando: ningún literal nuevo
      fuera de la hoja global.
- [ ] La cobertura sigue al 100 % en líneas, sentencias, funciones y ramas, y
      la CI entera pasa en local.
- [ ] Medido en navegador real sobre el build a 320, 390 y 1440px: el
      desbordamiento horizontal del documento sigue siendo 0px, la cabecera
      conserva su altura y ningún objetivo táctil del conmutador baja de 44px.
- [ ] El color de eje de `technical/0011` no se mueve: los seis filetes, los
      seis iconos y las seis barras siguen dando los mismos seis colores.

## Dependencias y supuestos

- Los valores de contraste están calculados con la misma fórmula de luminancia
  relativa de WCAG que implementa `scripts/validateContrast.ts`, sobre los
  neutros que fijó `technical/0009`. Si esos neutros se mueven, se recalculan.
- `--color-chrome` y el arranque del degradado son **opacos y calculados a
  mano** a partir del acento sobre blanco y sobre `paper`. Como
  `--color-accent-tint-solid`, son función de otro color: si el acento o los
  neutros cambian, hay que rehacerlos, y por eso queda escrito junto a su
  declaración.

## Decisiones abiertas

Ninguna.
