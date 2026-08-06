# 0012 — Configuración persistente y compartible

- **Id:** product/0012
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-06
- **Specs relacionadas:** product/0001, product/0009, product/0011
- **ADRs relacionados:** 0001, 0003
- **Doc de estado:** `docs/estado/interfaz.md`, `docs/estado/arquitectura.md`

## Contexto

Todo el estado con el que el usuario configura la comparativa vive en `useState`
dentro de `App.tsx`, y solo ahí: los seis pesos, los ocho supuestos globales, el
presupuesto, el filtro de «ocultar fuera de presupuesto» y las valoraciones que
el usuario ha sobrescrito por coche.

Eso tiene dos consecuencias, y las dos se notan al primer uso real:

- **Recargar la página lo pierde todo.** Volver al comparador después de
  cerrarlo significa reconstruir la configuración desde cero: seis
  deslizadores, el presupuesto, y —lo caro— las valoraciones de estética
  exterior, estética interior y confort de viaje, que son juicios propios del
  usuario, uno por coche y hasta tres por coche. Con once candidatos son
  hasta treinta y tres valoraciones que cuesta reintroducir y que no están en
  ninguna fuente: no son datos con procedencia, son opiniones.
- **No hay forma de enseñarle a alguien la comparativa.** La URL del sitio
  desplegado lleva siempre a la configuración por defecto. Compartir «cómo
  queda el ranking con mis pesos» exige, hoy, describir de palabra qué mover.

Un comparador cuya configuración no sobrevive a una recarga se usa una vez.

## Objetivo

Que la configuración del comparador sobreviva a cerrar el navegador, y que se
pueda compartir con un enlace.

## Alcance

- **Persistencia local** de la configuración entre visitas, en el propio
  navegador.
- **Un enlace compartible** que reproduce una configuración concreta en el
  navegador de otra persona.
- **Las reglas de precedencia** entre lo que trae el enlace, lo que hay
  guardado y los valores por defecto.
- **La degradación ante datos corruptos, incompletos o de una versión
  anterior**: qué se descarta, qué se conserva y qué se registra.
- **La vuelta a los valores por defecto** como acción explícita del usuario.
- **Qué se persiste y qué no.** Lo efímero —qué coche está desplegado— no es
  configuración.

## Fuera de alcance

- **Persistencia en servidor.** Está aplazada con su disparador —«que haga
  falta compartir estado entre dispositivos sin pasar por la URL»— en
  `docs/proceso/ci-y-guardarrailes.md` §7. Esta spec es justo la alternativa
  que hace que el disparador siga sin cumplirse.
- **Cuentas de usuario, identidad o autenticación.** No hay servidor: el
  proyecto es una SPA estática y el ADR 0003 lo fija.
- **Guardar varias configuraciones con nombre, o compararlas entre sí.**
  `product/0001` ya dejó fuera comparar configuraciones distintas; esta spec
  no lo reabre. Hay una configuración vigente, y un enlace la reproduce.
- **Histórico o deshacer.** No se guarda por dónde ha pasado la
  configuración, solo dónde está.
- **Persistir el catálogo.** `cars.json` se sirve con la aplicación; una
  copia local del catálogo sería otra fuente de verdad, que es exactamente lo
  que el proyecto evita.
- **Acortar el enlace con un servicio externo.** Sería un tercero (🔴) y una
  dependencia de red en una aplicación que hoy no tiene ninguna.
- **Cualquier dependencia nueva.** La validación se hace con Zod, que ya está
  en `package.json` desde `technical/0001`.

## Requisitos / comportamiento esperado

1. **Existe un único objeto de configuración**, con forma declarada y
   validada por Zod, que contiene: pesos por eje, supuestos globales,
   presupuesto, filtro de «ocultar fuera de presupuesto» y valoraciones
   sobrescritas por coche. Es el único objeto que se persiste y el único que
   se comparte.
2. **La configuración lleva número de versión.** Un objeto guardado con una
   versión que la aplicación no reconoce se descarta entero; no se intenta
   adivinar qué campos siguen valiendo.
3. **Precedencia, en este orden:** lo que traiga la URL gana sobre lo
   guardado localmente, y lo guardado localmente gana sobre los valores por
   defecto. Abrir un enlace compartido enseña **lo que el enlace dice**,
   aunque quien lo abra tenga su propia configuración guardada.
4. **Abrir un enlace compartido no destruye en silencio la configuración
   propia.** O bien la aplicación no guarda automáticamente lo que llega por
   URL hasta que el usuario lo modifica, o bien avisa antes de sustituir. La
   forma la decide la implementación; el requisito es que nadie pierda su
   trabajo por hacer clic en un enlace ajeno.
5. **La configuración se guarda al cambiar**, sin acción explícita del
   usuario. Guardar no es una tarea que haya que recordar.
6. **La URL no se reescribe sola.** El enlace compartible se genera cuando el
   usuario lo pide, con una acción explícita de copiar. Actualizar la URL en
   cada arrastre de un deslizador llenaría el historial del navegador de
   entradas basura y convertiría el botón «atrás» en algo impredecible.
7. **El enlace es legible.** Los parámetros llevan nombres cortos pero
   reconocibles, no una cadena opaca codificada. Un enlace que se puede leer
   se puede depurar, y se puede editar a mano cuando hace falta.
8. **Solo viaja en el enlace lo que se aparta de los valores por defecto.**
   Con la configuración por defecto, el enlace generado es la URL limpia del
   sitio. Así el enlace crece con lo que el usuario ha cambiado, y no con lo
   que existe.
9. **Una configuración inválida no rompe la aplicación.** Un valor fuera de
   rango, un eje desconocido, un coche que ya no está en el catálogo o un
   JSON corrupto se descartan y se cae a los valores por defecto para esa
   parte. La aplicación arranca siempre.
10. **Todo descarte se registra** con `logError` y el formato de log del
    ADR 0001, indicando qué se descartó y por qué. Un descarte silencioso es
    un fallo que nadie va a reproducir. `src/logging/logger.ts` solo expone
    hoy severidad `ERROR`; si se decide que un descarte merece `WARN`, eso es
    ampliar el ADR 0001 y se decide allí, no aquí.
11. **Las valoraciones sobrescritas se validan al restaurarlas**, no solo al
    introducirlas. `applyOverride` ya revalida el rango 1-5 contra
    `UserRatingSchema`; una valoración restaurada fuera de rango se descarta
    igual que cualquier otro dato inválido, y no llega al cálculo.
12. **Una valoración sobrescrita de un coche que ya no está en el catálogo se
    descarta**, y las de los coches que sí están se conservan. El catálogo se
    edita en el repositorio y cambia entre despliegues.
13. **Lo efímero no se persiste**: qué coche está desplegado, la posición de
    desplazamiento y cualquier estado de interfaz que no sea configuración.
14. **Existe una acción explícita de volver a los valores por defecto**, que
    limpia lo guardado localmente y deja la aplicación como una primera
    visita.
15. **Si el almacenamiento local no está disponible** —modo privado,
    almacenamiento lleno, permiso denegado—, la aplicación funciona
    igualmente, sin persistencia y sin error visible por ello. Se registra
    una vez, no en cada cambio.
16. **La lectura y la escritura del almacenamiento son un puerto**, no
    llamadas a `localStorage` esparcidas por los componentes. Es la regla de
    `docs/proceso/estilo.md` §1: lo que el núcleo necesita de fuera lo declara
    como puerto, y el *wiring* vive en el punto de arranque.
17. **Ninguna puntuación cambia** por efecto de esta spec: con la
    configuración por defecto restaurada, el ranking es el de hoy.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Cambiar los seis pesos, el presupuesto, un supuesto y una valoración,
      recargar la página, y encontrar exactamente los mismos valores.
- [ ] Cerrar el navegador por completo, volver a abrirlo y encontrar la misma
      configuración.
- [ ] Con la configuración por defecto, el enlace generado no tiene
      parámetros: es la URL limpia del sitio.
- [ ] Cambiando **un solo** peso, el enlace generado contiene un parámetro y
      no doce.
- [ ] Abrir el enlace generado en un navegador sin configuración guardada
      reproduce exactamente la configuración de origen, incluidas las
      valoraciones sobrescritas.
- [ ] Abrir un enlace compartido en un navegador **con** configuración
      guardada distinta muestra la del enlace, y la guardada no se pierde sin
      que el usuario lo sepa.
- [ ] Arrastrar un deslizador de un extremo a otro añade **cero** entradas al
      historial del navegador.
- [ ] Escribir a mano en el almacenamiento local un JSON corrupto y recargar:
      la aplicación arranca con los valores por defecto, muestra el ranking,
      y hay una entrada de log con el motivo del descarte.
- [ ] Escribir a mano una configuración con `version` desconocida y recargar:
      se descarta entera y se registra.
- [ ] Escribir a mano una valoración de 9 sobre un rango 1-5 y recargar: se
      descarta esa valoración, el resto de la configuración se conserva, y el
      cálculo no la recibe.
- [ ] Guardar una valoración de un coche, quitar ese coche de `cars.json`,
      recargar: la aplicación arranca, la valoración huérfana se descarta y
      las de los demás coches siguen ahí.
- [ ] Con el almacenamiento local deshabilitado en el navegador, la
      aplicación arranca, se puede usar entera, y no muestra ningún error al
      usuario por ese motivo.
- [ ] La acción de volver a los valores por defecto deja la aplicación
      idéntica a una primera visita, comprobado recargando después.
- [ ] Desplegar un coche, recargar, y comprobar que ningún coche queda
      desplegado: lo efímero no se ha persistido.
- [ ] Existe un test unitario del *parser* de configuración —con Zod— que
      cubre: válida, corrupta, versión desconocida, valor fuera de rango y
      coche inexistente. Entra en el suelo de cobertura del 100 %, porque no
      es código de `ui/`.
- [ ] `npm run arch:check` pasa: ningún módulo de `src/domain/` importa el
      adaptador de almacenamiento ni conoce `window`.
- [ ] `package.json` no tiene ninguna dependencia nueva respecto a la rama
      base.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local.

## Dependencias y supuestos

- **No depende de la fase 3 ni de las demás specs de la fase 4.** Es
  ortogonal: persiste lo que haya, sea cual sea la escala de los ejes y el
  aspecto de la interfaz. Puede implementarse en cualquier orden.
- **Interacción conocida con `product/0003`:** aquella spec quita `anios` de
  los supuestos globales. Una configuración guardada antes de ese cambio
  contendrá un campo que después no existirá. Es exactamente el caso que el
  número de versión resuelve, y por eso el requisito 2 no es una precaución
  teórica.
- Se asume que la configuración cabe holgadamente en una URL. Con seis pesos,
  ocho supuestos, el presupuesto, un filtro y hasta treinta y tres
  valoraciones —y omitiendo todo lo que esté en su valor por defecto—, el
  caso peor está muy por debajo del límite práctico de unos 2.000 caracteres.
  Si algún día no cupiera, el requisito 8 es lo que hace que el caso normal
  siga siendo corto.
- Se asume que `localStorage` es el mecanismo de persistencia local. Es
  síncrono, está disponible en todos los navegadores objetivo y no necesita
  permiso. El requisito 16 lo mantiene detrás de un puerto, así que
  sustituirlo por `IndexedDB` más adelante no tocaría el dominio.
- Se asume que la configuración es **datos del propio usuario en su propio
  navegador**: no hay datos de terceros, ni credenciales, ni nada que
  justifique cifrado o consentimiento. Si algún día se persistiera algo que
  no sea del usuario, eso es 🔴 y otra spec.
- Se asume que el enlace se comparte por medios del usuario —copiar y pegar—
  y que la aplicación no envía nada a ninguna parte. No hay salida de red en
  esta spec.

## Decisiones abiertas

1. **Cómo se resuelve el requisito 4.** Las dos salidas —no guardar lo que
   llega por URL hasta que el usuario toque algo, o avisar antes de
   sustituir— dan experiencias distintas y hay que elegir una. La primera es
   más silenciosa y la segunda más explícita; ninguna es obviamente mejor, y
   por eso la decisión es de producto.
2. **Si el filtro de «ocultar fuera de presupuesto» es configuración o es
   estado efímero.** El presupuesto claramente es configuración. El filtro es
   más discutible: se parece a un estado de vista, pero acompaña al
   presupuesto y compartir uno sin el otro reproduce mal la comparativa. El
   requisito 1 lo incluye; si se decide lo contrario, el requisito 1 y el
   requisito 13 cambian a la vez.
3. **Si esta spec necesita un doc de estado nuevo.** La cabecera declara
   `interfaz.md` y `arquitectura.md`, pero un puerto de persistencia con su
   formato versionado se parece bastante al «modelo de datos» que
   `docs/proceso/consolidacion.md` §4 lista como pendiente de crear
   (`docs/estado/datos.md`). Cerrarlo antes de aprobar: es una de las dos
   áreas sin doc registradas como deuda en el roadmap, y esta spec es
   candidata a ser la que la declare.
