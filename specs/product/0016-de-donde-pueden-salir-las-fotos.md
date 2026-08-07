# 0016 — De dónde pueden salir las fotos

- **Id:** product/0016
- **Estado:** implemented
- **Tipo:** product
- **Fecha:** 2026-08-07
- **Specs relacionadas:** product/0014
- **ADRs relacionados:** 0003
- **Doc de estado:** `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

`product/0014` no dice de dónde tienen que salir las fotos. Sus supuestos
dicen que el uso es personal y sin ánimo de lucro, «que es lo que hace
aceptable enseñar fotografía de prensa ajena», y que **se prefiere el medio
oficial del fabricante como origen**. El esquema solo exige tres cosas —`url`
absoluta `https`, `credit` no vacío y `shows` no vacío—, y ni una palabra
sobre licencias.

Quien implementó las dos tandas de fotos, sin embargo, se limitó a **Wikimedia
Commons**, y esa limitación acabó escrita como si fuera doctrina en
`.claude/skills/add-model/references/photo-sourcing.md`. No venía de la spec:
venía de que Commons resuelve de una vez el problema práctico de tener autoría
y licencia legibles por máquina, y de que se puede consultar por API.

El resultado, tras dos tandas, es que **faltan trece vistas de sesenta, y diez
son de maletero**. Wikimedia casi no tiene esa vista: es fotografía de
aficionado en salones y concesionarios, donde nadie abre el portón. Las
búsquedas por `trunk`, `boot`, `Kofferraum`, `bagagliaio` y `트렁크` no
devuelven nada aprovechable. El hueco no se cierra insistiendo en la misma
fuente.

## Objetivo

Declarar qué orígenes de foto son aceptables y qué hay que dejar escrito de
cada uno, de forma que se puedan usar fuentes fuera de Wikimedia Commons
—empezando por los medios oficiales de los fabricantes— sin que «de dónde
salió esto» dependa de la memoria de quien la puso.

## Alcance

- Los **orígenes aceptables** de una foto, en orden de preferencia.
- Qué tiene que contener `credit` cuando la fuente no publica una licencia con
  nombre, que es el caso normal fuera de Commons.
- **Enlazar sigue siendo obligatorio**: esta spec no reabre la decisión de
  `product/0014` de no copiar imágenes al repositorio.
- Las consecuencias técnicas de salir de Commons —bloqueo por `Referer`,
  enlaces que caducan— y qué se hace con ellas.
- La actualización de la skill `add-model` para que deje de presentar Commons
  como la única vía.

## Fuera de alcance

- **Copiar imágenes al repositorio.** Sigue prohibido, por la misma razón que
  en `product/0014`: alojar la imagen es reproducirla, enlazarla no. Es la
  diferencia que sostiene todo lo demás, y esta spec la refuerza en vez de
  tocarla.
- **Monetizar, poner publicidad o abrir la aplicación como servicio.** El
  supuesto de uso personal y sin ánimo de lucro es la base de lo que aquí se
  permite; si algún día deja de ser cierto, esta spec deja de valer y hay que
  reabrirla, no reinterpretarla.
- **Fotografía de agencia o de banco de imágenes** (Getty, Shutterstock y
  equivalentes), y **fotografía de prensa especializada con marca de agua**.
  Están fuera aunque se enlacen: son negocios de licenciar imágenes, y
  enlazarlas sin licencia es exactamente el uso contra el que existen.
- **Fotos de particulares sacadas de foros, redes sociales o anuncios de
  compraventa.** No hay autoría fiable que escribir en `credit`.
- **Cambiar `PhotoSchema`.** Los tres campos actuales bastan; lo que cambia es
  qué se escribe en `credit`, no qué campos hay.
- **Reprocesar las 47 fotos ya cargadas.** Las de Commons siguen siendo
  válidas y no se tocan.

## Requisitos / comportamiento esperado

### 1. Orígenes aceptables, en orden de preferencia

1. **El medio oficial del fabricante** (sala de prensa, *newsroom*, *media
   site*: Kia Press, Hyundai Newsroom, Stellantis Media, BMW PressClub, Honda
   Press, Toyota/Lexus Media…). Es el primero por dos razones que van juntas:
   son imágenes publicadas para que se reproduzcan al hablar del coche, y son
   las que con más seguridad enseñan **la versión correcta**, que es el
   problema que más veces ha obligado a descartar candidatas.
2. **Wikimedia Commons y repositorios de licencia libre equivalentes**. Siguen
   siendo la opción más limpia cuando tienen la vista que hace falta.
3. **El configurador o la web comercial del propio fabricante**, cuando la
   sala de prensa no llega. Es el mismo titular de derechos, con enlaces más
   frágiles.
4. **Importadores nacionales y concesionarios oficiales de la marca**
   (decisión del 2026-08-07). Son los que fotografían **stock real**, y por
   eso son los únicos que enseñan de forma rutinaria el **maletero abierto**,
   que es la vista que ninguna de las tres anteriores cubre. Entran los
   últimos y con dos cautelas escritas, porque no son el titular de la marca:
   `credit` nombra al concesionario o importador concreto —no «un
   concesionario»—, y su enlace es el más frágil de los cuatro, así que es el
   primero que hay que sospechar cuando `check:photos` se ponga rojo.

Cualquier otro origen **no entra sin decisión humana explícita**, caso a caso
y escrita. No hay una quinta categoría abierta: en particular, que un
concesionario sea aceptable **no** convierte en aceptable a cualquiera que
venda coches en internet (portales de anuncios, compraventas, agregadores),
que no son de la marca y cuya autoría no es verificable.

### 2. Qué se escribe en `credit`

`credit` deja de ser solo un nombre y una licencia. Tiene que permitir a quien
lo lea dentro de un año **reconstruir de dónde salió la imagen**:

- Con licencia con nombre (Commons y equivalentes), se mantiene lo de hoy:
  `"Wikimedia Commons — <Autor> (<Licencia>)"`.
- Sin licencia con nombre, se escribe **el titular y el medio**, no una
  licencia inventada: `"Kia Press (medio oficial de Kia)"`,
  `"BMW PressClub (medio oficial de BMW)"`. **Nunca** se escribe «CC» ni
  ninguna licencia que la fuente no declare: escribir una licencia falsa es
  peor que no escribir ninguna, porque le da a la siguiente persona una
  seguridad que no existe.

### 3. La versión sigue mandando sobre la fuente

La regla general no cambia: la foto tiene que corresponder al modelo y la
motorización que el catálogo puntúa, y `shows` lo declara. Una foto oficial de
la versión equivocada es peor que una de aficionado de la correcta, porque
parece más fiable.

**Excepción acotada para maletero e interior** (decisión del 2026-08-07). En
esas dos vistas se admite una unidad de **otro acabado o motorización del
mismo modelo y generación**, con dos condiciones:

1. **`shows` dice qué unidad se fotografió**, con sus palabras, sin disimular
   la diferencia: «Mazda CX-5 (KF), habitáculo en negro — unidad 2.5 Turbo
   AWD; mismo habitáculo que el MHEV que puntúa la ficha». Quien lo lea tiene
   que enterarse sin abrir la URL.
2. **Solo si lo que se ve no cambia entre versiones.** Si el acabado altera de
   verdad lo que enseña la foto —tapicería de otro material, salpicadero
   distinto, doble fondo o rueda de repuesto que cambian el maletero—, la
   excepción no aplica y la vista se deja vacía.

**Por qué solo estas dos.** El maletero y el habitáculo son los mismos en todo
el modelo salvo detalle de tapicería; el exterior no. Un lateral de otra
motorización puede traer llantas, faldones o escapes distintos, y esta
aplicación existe justo para comparar formas y tamaños: ahí la diferencia
falsea lo que el usuario está mirando. En frontal, lateral y trasera el
requisito 3 de `product/0014` sigue entero.

Esto **regulariza lo que ya se estaba haciendo**: entre las 47 fotos ya
cargadas hay casos que se apoyaban en esta excepción sin que estuviera escrita
(el interior del Tonale es el PHEV Q4 y el del CX-5 el 2.5 Turbo, ambos
declarados en `shows`). Quedaban correctos por criterio de quien los puso, no
por regla — que es exactamente lo que esta spec viene a arreglar.

### 4. Consecuencias técnicas de salir de Commons

1. **Bloqueo por `Referer`.** Muchos medios de fabricante rechazan las
   peticiones sin cabecera `Referer`, y la aplicación envía hoy
   `referrerpolicy="no-referrer"` en la miniatura. Si una foto aceptada no
   carga por eso, la respuesta es **descartarla y buscar otra**, no rebajar la
   política de *referrer* de toda la aplicación por una imagen.
2. **Los enlaces caducan más.** Un `thumburl` de Commons es estable; un
   configurador se reorganiza. `npm run check:photos` pasa de ser una
   comprobación de cierre a ser la herramienta que detecta el enlace muerto, y
   conviene correrlo de vez en cuando aunque no se toquen fotos.
3. **Una foto que deja de cargar ya degrada sola** al hueco rotulado, desde la
   corrección del 2026-08-07 de `product/0014`. Un enlace muerto afea la
   ficha; no la rompe.

### 5. La skill deja de predicar Commons

`.claude/skills/add-model/references/photo-sourcing.md` describe hoy Commons
como *la* vía. Pasa a describir el orden de preferencia del requisito 1, con
Commons como una fuente más —la mejor cuando tiene la foto— y con la sala de
prensa del fabricante por delante para las vistas que Commons no cubre,
señaladamente el maletero.

## Criterios de aceptación

> Obligatorios y verificables.

- [x] `product/0014` queda enmendada donde decía o daba a entender que la
      fuente era Commons, con referencia a esta spec: el supuesto de uso
      personal, el de comprobar la versión —ahora con su excepción— y el
      criterio de aceptación que contaba las 47 fotos.
- [x] La skill `add-model` describe el orden de preferencia del requisito 1 y
      ya no presenta Commons como única vía (revisión del texto).
- [x] Ninguna foto del catálogo declara en `credit` una licencia que su fuente
      no publique. Las dos primeras entradas bajo esta spec —lateral y
      maletero del Kona Eléctrico, de Hyundai Newsroom— acreditan
      `"Hyundai Newsroom Europa (medio oficial de Hyundai)"`, **sin licencia**,
      porque la fuente no publica ninguna con nombre (requisito 2).
- [x] `npm run check:photos` sigue en verde sobre el catálogo entero: 50/50 el
      2026-08-07, incluidas las tres servidas por Hyundai y Honda. Se comprobó además
      que **cargan sin cabecera `Referer`**, que era el riesgo que anticipa el
      requisito 4.1.
- [x] La CI entera pasa en local.

## Dependencias y supuestos

- **La aplicación está desplegada en abierto**, no en una intranet: cualquiera
  con la URL de GitHub Pages la ve, y un buscador puede indexarla. El supuesto
  de `product/0014` es *sin ánimo de lucro*, no *privado*, y esta spec lo
  escribe tal cual para que nadie razone sobre una privacidad que no existe.
  Lo que sostiene el planteamiento no es que no se vea, es que **no se
  monetiza, se atribuye y se enlaza en vez de copiar**.
- **Enlazar y alojar no son lo mismo.** Toda la spec descansa en que el
  navegador de quien mira pide la imagen al servidor del titular, que puede
  dejar de servirla cuando quiera. Si algún día se copiaran las imágenes al
  repositorio, este razonamiento se cae entero.
- **`photoSrc()` sigue siendo el único punto** por el que una URL llega al
  `src` (`product/0014`, requisito 2). Es lo que haría reversible un cambio de
  política sin tocar la interfaz.
- **Esto no es asesoramiento legal.** Es la política que el proyecto se da a
  sí mismo, escrita para ser revisable; no un dictamen sobre qué es lícito en
  ninguna jurisdicción.

## Decisiones abiertas

> Las dos que esta spec abrió se cerraron el 2026-08-07, y su respuesta está
> en los requisitos, no aquí: **sí entran** importadores y concesionarios
> oficiales, los últimos y con el crédito nombrando a cuál (requisito 1.4), y
> **sí vale** una unidad de otro acabado o motorización **solo en maletero e
> interior**, declarándolo en `shows` y solo cuando no cambie lo que se ve
> (requisito 3).

Ninguna.
