# 0006 — Los estilos de la interfaz: CSS propio con tokens

- **Estado:** approved
- **Fecha:** 2026-08-06
- **Nivel:** 🟡

## Contexto

La aplicación **no tiene ni una línea de CSS**. No hay ningún fichero `.css`
en el repositorio, `index.html` no enlaza hoja de estilos alguna y ningún
componente de `src/ui/` declara `className` ni `style`. Lo que hoy se sirve en
GitHub Pages es HTML sin estilar: el ranking es una `<ol>` con viñetas, cada
coche es un `<button>` con el aspecto por defecto del navegador y los pesos
son seis `input[type="range"]` desnudos.

Eso no es un descuido: `technical/0001` levantó el andamiaje y `product/0001`
trajo las fórmulas y el desglose, y ninguna de las dos tenía el diseño en su
alcance. La fase 4 sí lo tiene. Traerlo obliga a decidir **cómo se escribe
CSS aquí antes de escribir el primero**, porque la primera hoja de estilos
fija el modelo de facto para todas las demás, y revertirlo después es
reescribir la interfaz entera.

El artefacto de referencia no ayuda a decidir, porque **su propio modelo de
estilos no es migrable**: estila con atributos `style` en línea y una
constante de siete colores en la cabecera del fichero. Eso funciona en un
fichero suelto y se rompe en cuanto se necesita un `:hover`, un foco visible o
una media query — ninguna de las tres es expresable en el atributo `style`, y
el artefacto, en consecuencia, no tiene ninguna de las tres.

La decisión es de calado por dos motivos independientes. Uno: la opción más
directa para un proyecto React —adoptar un framework de utilidades— es una
**dependencia nueva**, y `docs/proceso/estilo.md` §1 las somete a decisión
explícita 🟡. Dos: el sitio de donde salen el color, el espaciado y la
tipografía determina si el diseño se puede revisar en un diff o queda
esparcido por el marcado, que es exactamente donde el artefacto lo tiene.

## Decisión

Los estilos se escriben en **CSS propio**, con dos piezas:

1. **Tokens como *custom properties* de CSS**, declaradas una sola vez en
   `:root` en una hoja global. Color, espaciado, tipografía, radios,
   sombras y puntos de ruptura salen de ahí y de ningún otro sitio.
2. **CSS Modules por componente** (`Componente.module.css`, junto al `.tsx`),
   que Vite soporta de forma nativa sin configuración ni dependencia. Cada
   componente estila lo suyo; los selectores no se escapan de su módulo.

Los valores literales de diseño —un `#1a73e8`, un `12px`, un `1.4rem`— viven
**solo** en la declaración de tokens. Una regla de un módulo que necesite un
color usa `var(--color-…)`; si el token que necesita no existe, se añade a la
hoja global, no se escribe el literal.

No se adopta ninguna librería de estilos: ni framework de utilidades, ni
CSS-in-JS, ni sistema de componentes de terceros. El recuento de dependencias
de producción sigue siendo el de hoy: `react`, `react-dom` y `zod`.

## Alternativas consideradas

- **Tailwind CSS (o cualquier framework de utilidades).** **Se descarta** por
  dos razones que se suman: es una dependencia nueva con su paso de build y su
  fichero de configuración, justo lo que `estilo.md` §1 obliga a decidir
  aparte; y traslada el diseño al marcado, de modo que cambiar un espaciado en
  toda la aplicación pasa a ser una búsqueda y reemplazo por los `.tsx` en vez
  de una línea en un fichero de tokens. **Y no ahorra la traducción**, que
  sería su único argumento de peso aquí: el artefacto no usa clases de
  utilidad, así que su diseño hay que traducirlo igual, se elija lo que se
  elija.
- **CSS-in-JS (`styled-components`, `emotion`).** Dependencia en tiempo de
  ejecución que inyecta estilos desde JavaScript. **Se descarta**: en una SPA
  estática sin renderizado en servidor no compra nada que el CSS no dé ya, y
  añade peso al bundle y un coste por render. Además complicaría los tests
  actuales, que renderizan con `renderToStaticMarkup`.
- **Una única hoja global sin módulos.** Cero herramienta, cero
  configuración. **Se descarta** porque todos los selectores son globales: el
  aislamiento entre componentes pasa a depender de una convención de nombres
  y de la disciplina de quien escribe. CSS Modules da exactamente lo mismo
  con el aislamiento comprobado por el propio build, y sin dependencia nueva.
- **Estilos en línea (`style={{ … }}`), que es lo que hace el artefacto.**
  **Se descarta por incapaz**, no por gusto: el atributo `style` no admite
  media queries, ni `:hover`, ni `:focus-visible`. Con él, ni el diseño
  responsive ni un indicador de foco accesible son expresables, y ambos son
  requisitos de la fase 4. El artefacto es la demostración: no tiene ni un
  estado de foco, ni un `:hover`, ni una media query en 385 líneas.

## Consecuencias

**Se gana:**

- Cero dependencias nuevas. El árbol de producción no crece y no aparece una
  superficie más que Dependabot tenga que seguir.
- El diseño se revisa en un sitio. Un cambio de paleta o de escala de
  espaciado es un diff en la hoja de tokens, legible sin abrir un componente.
- Los puntos de ruptura y `prefers-reduced-motion` son media queries de CSS
  normales, sin traducción de por medio. Un esquema oscuro futuro pasa a ser
  un cambio de valores en un fichero.
- La decisión tipográfica del artefacto —cifras en monoespaciada, texto en
  sans— se expresa como dos tokens y se aplica sola. Con clases de utilidad
  serían dos cadenas repetidas en cada elemento que enseña un número.

**Se pierde:**

- Hay que **traducir a mano** el diseño del artefacto, de sus `style` en línea
  a tokens y módulos. Es trabajo real, y se paga una vez. Ninguna de las
  alternativas lo ahorraba.
- No hay autocompletado de clases de utilidad en el editor.
- La disciplina de «ningún literal fuera de los tokens» no la impone hoy
  ninguna herramienta. `technical/0004` decide si se convierte en un gate de
  CI o se queda en convención revisada a mano; hasta que eso se decida, es
  convención.

**Queda aplazado:**

| Aplazado | Disparador |
| --- | --- |
| **Un esquema oscuro**, ya sea heredado de `prefers-color-scheme` o elegido por el usuario. El diseño de referencia tiene un solo aspecto, y añadirle una paleta oscura es inventar diseño que nadie ha pedido. Que sea barato hacerlo después es justo lo que compran los tokens | Que alguien lo pida, o que el comparador se use de noche lo bastante como para que moleste |
| Extraer los primitivos a un paquete reutilizable | Que exista una segunda aplicación que los consuma. Hoy hay una |
| Una librería de componentes accesibles de terceros | Que haga falta un control compuesto —combobox, diálogo modal, menú— cuya accesibilidad no sea razonable escribir a mano |

**Sobre la verificación:** el CSS **no entra en el suelo de cobertura**. Una
hoja de estilos no tiene ramas que ejecutar, y los tests actuales
—`renderToStaticMarkup`, sin jsdom— no calculan estilos. Lo visual se
verifica mirándolo renderizado en los tamaños que importan, como ya obliga
`docs/proceso/estilo.md` §3. Esto no cierra la deuda de cobertura de `ui/`
registrada en `docs/roadmap.md`: la ensancha, y por eso se deja escrito aquí.

## Historial

- **2026-08-06 — Creación.** Se registra al abrir la fase 4, antes de escribir
  la primera hoja de estilos del proyecto, para que el modelo de estilos sea
  una decisión y no el residuo de la primera implementación que llegue.
- **2026-08-06 — Revisión contra el artefacto original.** Al aparecer el
  fuente del artefacto se comprueba que **no usa Tailwind**: estila con
  atributos `style` en línea y una constante de siete colores. Eso refuerza la
  decisión por un motivo distinto del previsto —no hay clases que copiar, así
  que la alternativa del framework de utilidades tampoco ahorraba la
  traducción— y confirma la descarte de los estilos en línea, que en el propio
  artefacto ya impiden todo *hover*, todo foco visible y toda media query. Se
  sustituye el aplazamiento del selector de tema por el del esquema oscuro
  entero: el diseño de referencia tiene un solo aspecto.
