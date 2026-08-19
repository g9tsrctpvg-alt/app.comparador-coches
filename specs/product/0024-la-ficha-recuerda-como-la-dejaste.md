# 0024 — La ficha recuerda cómo la dejaste

- **Id:** product/0024
- **Estado:** implemented
- **Tipo:** product
- **Fecha:** 2026-08-19
- **Specs relacionadas:** product/0012, product/0018, product/0020, product/0023
- **ADRs relacionados:** 0001, 0003, 0007
- **Doc de estado:** `docs/estado/interfaz.md`

> ⚠️ **Spec histórica — implementada, sin consolidar.** Describe un cambio ya
> implementado: su sección *Contexto* retrata el sistema **anterior** al
> cambio y hoy no es cierta. **No es referencia del estado actual** — para
> eso, ver el **Doc de estado** indicado arriba. Vigentes aquí los
> **criterios de aceptación**, como registro de verificación.

## Contexto

`product/0012` dejó la configuración del comparador persistida y
compartible: los seis pesos, los siete supuestos globales, el presupuesto,
el filtro de presupuesto y las valoraciones sobrescritas viven en
`AppConfig` (`src/domain/config.ts`), se guardan en `localStorage` detrás
de un puerto y viajan en un enlace. Eso sobrevive a cerrar el navegador.

Lo que no sobrevive es **la ficha**. Sus cinco controles viven en el
`useState` local de `FichaPage`:

| Control | Estado | Valor al volver |
| --- | --- | --- |
| Comparar | `comparisonId` | Vuelve al Alfa Romeo Giulietta |
| Campos | `fieldSet` | Vuelve a «Esenciales» |
| Orden | `sortCriterion` | Vuelve a «Longitud» |
| Foto | `photoView` | Vuelve a «Lateral» |
| Candidato enfocado (móvil) | `focusedId` | Vuelve al primero de la tira |

Los cuatro primeros son las cuatro pastillas de la barra que
`technical/0010` unificó, y son elecciones deliberadas: «compárame todo
contra el CR-V, con los veintidós campos, ordenado por precio». El quinto
es el candidato que `product/0023` enfoca por debajo de `--bp-columna`.
Ninguno se reconstruye solo, y quien entra en la ficha una segunda vez
tiene que rehacer los cuatro clics antes de volver a mirar sus datos.

`product/0012`, requisito 13, decidió lo contrario a propósito —«lo
efímero no se persiste»— y su criterio de aceptación lo verificó sobre la
fila desplegada del ranking. Esa decisión sigue siendo la correcta para la
fila desplegada, para los paneles plegables y para el scroll. No lo es para
los cinco controles de arriba: elegir un modelo de comparación en un
`<select>` no es lo mismo que desplegar una fila para mirar dentro, aunque
las dos cosas se implementen con un `useState`. La línea entre «efímero» y
«configuración» no la marca dónde vive el estado, sino si el usuario lo
eligió para quedarse.

## Objetivo

Que las cinco elecciones de la ficha sobrevivan a cerrar el navegador, sin
que ninguna de ellas se cuele en el enlace compartible ni en la
configuración que ese enlace reproduce.

## Alcance

- **Un segundo objeto persistido**, `ViewState`, separado de `AppConfig`:
  su forma, su versión, su clave de almacenamiento y sus valores por
  defecto.
- **Los cinco campos** de la tabla de arriba, y solo esos cinco.
- **La restauración tolerante**: qué se descarta, qué se conserva y qué se
  registra, incluida la validez referencial contra el catálogo vigente.
- **La frontera con `product/0012`**: qué sigue sin persistirse y por qué
  el requisito 13 de aquella spec sigue vigente para todo lo demás.
- **El efecto de «Restablecer»** sobre este segundo objeto.

## Fuera de alcance

- **El enlace compartible.** `configToParams` y `paramsToRawConfig`
  (`src/domain/configUrl.ts`) no cambian: un enlace sigue reproduciendo
  exactamente la configuración de `product/0012`, ni un parámetro más. Un
  enlace que además impusiera el orden y el conjunto de campos de quien lo
  mandó estaría compartiendo dos cosas distintas bajo el mismo botón.
- **La fila desplegada del ranking** (`expandedId`, `RankingList`). Sigue
  sin persistirse: `product/0012`, requisito 13, no se toca ahí.
- **El estado de los paneles plegables** (`CollapsiblePanel`, por debajo de
  `--bp-columna`). Sigue sin persistirse; recordarlos abiertos abriría la
  aplicación sobre una pantalla de controles en vez de sobre el ranking.
  Como consecuencia, `CollapsiblePanel` **no necesita identidad propia** y
  no se toca.
- **La posición de desplazamiento**, ni del documento ni del contenedor de
  la tabla de la ficha. Depende del ancho, del conjunto de campos elegido y
  del catálogo del día: restaurarla mal desorienta más que no restaurarla.
  Queda aplazada con disparador: **que alguien reporte haber perdido el
  sitio en la tabla al volver**, no antes.
- **El diálogo de la foto** (`openPhoto`). Abrir la aplicación sobre un
  modal que nadie acaba de pedir es desorientador, y `showModal()` sin un
  gesto del usuario detrás es frágil.
- **El aviso «Copiado»** de `ConfigActions`, que dura dos segundos.
- **Recordar la última vista visitada y redirigir al entrar.** La ruta vive
  en el fragmento de la URL (`useHashRoute`) y ya sobrevive a una recarga.
  Redirigir haría que la URL raíz llevara a sitios distintos según quién la
  abra, que es justo lo que un enlace no debe hacer.
- **Persistencia en servidor, cuentas, histórico y varias vistas con
  nombre.** Todo eso ya está fuera de alcance en `product/0012` y esta spec
  no lo reabre.
- **Cualquier cálculo del dominio.** Ninguna puntuación, ninguna Δ y ningún
  orden cambian por efecto de esta spec.
- **Cualquier dependencia nueva.** La validación se hace con Zod, que ya
  está en `package.json`.

## Requisitos / comportamiento esperado

1. **Existe un segundo objeto de estado de vista**, `ViewState`, con forma
   declarada y validada por Zod, que contiene exactamente cinco campos: el
   modelo de comparación, el conjunto de campos, el criterio de orden, la
   vista de foto y el candidato enfocado. Es el único estado de interfaz
   que se persiste.
2. **`ViewState` es un objeto aparte de `AppConfig`, con su propia clave de
   almacenamiento y su propio número de versión.** No es una preferencia
   estética: `AppConfig` es lo que viaja en el enlace, y meter aquí estos
   campos los metería también allí (requisito 4). Además, una versión
   compartida obligaría a descartar la configuración entera —pesos,
   supuestos y valoraciones incluidos— cada vez que se añada o se quite un
   control de la ficha.
3. **`ViewState` lleva número de versión**, con la misma regla que
   `AppConfig`: un objeto guardado con una versión que la aplicación no
   reconoce se descarta entero. **Descartarlo no toca la configuración**:
   las dos claves son independientes en lectura, en escritura y en versión.
4. **El estado de vista no viaja en el enlace compartible.** Con la
   configuración por defecto, el enlace sigue siendo la URL limpia del
   sitio por muchos controles de la ficha que se hayan movido. Y quien abre
   un enlace ajeno sigue viendo **su propia** ficha, porque la única
   precedencia que existe aquí es la del requisito 5.
5. **Precedencia: lo guardado gana sobre los valores por defecto**, y no
   hay una tercera fuente. Al no haber URL de por medio, tampoco hay
   equivalente al requisito 4 de `product/0012`: no existe el caso «esto
   viene de fuera, no lo guardes todavía».
6. **El estado de vista se guarda al cambiar**, sin acción explícita del
   usuario, igual que la configuración.
7. **Restauración con degradación por partes.** Un campo presente pero
   inválido —un conjunto de campos que no existe, un criterio de orden
   desconocido— se descarta, cae a su valor por defecto y se registra. Un
   campo simplemente ausente no es un descarte y no se registra.
8. **Los dos campos que son identificadores se validan contra el catálogo
   vigente.** Un `comparisonId` que no corresponde a ninguna referencia
   disponible, o un candidato enfocado que ya no está en el catálogo
   publicado, se descartan y caen a su valor por defecto. El catálogo se
   edita en el repositorio y cambia entre despliegues; un coche
   despublicado por `product/0015` cuenta como ausente.
9. **«Ninguno» es un valor legítimo del modelo de comparación, y se
   distingue de «no había nada guardado».** Quien deja la ficha sin
   comparación la encuentra sin comparación al volver, no con la referencia
   por defecto puesta.
10. **El candidato enfocado restaurado que ya no esté en la tira cae al
    primero**, por el mismo mecanismo que `product/0023`, requisito 4
    —`scrollableEntities.find(…) ?? scrollableEntities[0]`— y no por un
    efecto que lo reponga a mano.
11. **Todo descarte se registra** con `logError` y el formato del ADR 0001,
    diciendo qué campo se descartó y por qué.
12. **La primera visita se ve exactamente como hoy**: Comparar en la
    primera referencia del catálogo (hoy el Alfa Romeo Giulietta), Campos
    en «Esenciales», Orden en «Longitud», Foto en «Lateral» y el foco en el
    primer candidato de la tira.
13. **La acción de restablecer limpia también el estado de vista.** Deja la
    aplicación como una primera visita en las dos claves, no en una;
    `product/0012`, requisito 14, dejaría de ser cierto si esta clave
    sobreviviera.
14. **Si el almacenamiento local no está disponible**, la aplicación
    funciona igual, sin persistencia y sin error visible. Se registra una
    vez por carga de página, no una vez por clave ni una vez por intento.
15. **La lectura y la escritura siguen siendo un puerto.** Se amplía
    `src/adapters/localStorageConfigPort.ts` con las operaciones de la
    clave nueva; ningún componente llama a `localStorage`, y `src/domain/`
    sigue sin conocer `window` ni el adaptador —lo comprueba la regla
    `domain-no-storage-adapter`—.
16. **El requisito 13 de `product/0012` sigue vigente para todo lo demás.**
    Esta spec lo enmienda **solo** para los cinco campos del requisito 1;
    la fila desplegada, los paneles plegables, el scroll y el diálogo de la
    foto siguen siendo efímeros por decisión, no por descuido.
17. **Ninguna puntuación y ninguna Δ cambian** por efecto de esta spec.
18. **Mover cualquiera de los cinco controles no añade entradas al
    historial del navegador**, igual que hoy: la aplicación no reescribe la
    URL sola (`product/0012`, requisito 6).

## Criterios de aceptación

> Obligatorios y verificables.

- [x] Cambiar los cuatro controles de la barra de la ficha a valores
      distintos de los de por defecto, recargar la página, y encontrar
      exactamente los cuatro valores elegidos. Comprobado con Playwright
      contra `npm run preview`: los cuatro `<select>` (Campos, Comparar,
      Orden, Foto) conservan el valor elegido tras `page.reload()`.
- [x] Por debajo de `--bp-columna`, enfocar un candidato que no es el
      primero de la tira, recargar, y encontrar ese mismo candidato
      enfocado y su tarjeta delante. Comprobado con Playwright a 390px:
      tras elegir el segundo chip de la tira y recargar, sigue siendo el
      único con `aria-current="true"`.
- [x] Capturar el estado del navegador, cerrar el contexto y abrir uno
      nuevo con ese estado: los cinco valores siguen ahí. Comprobado con
      Playwright: `context.storageState()` capturado tras cambiar «Orden»,
      contexto cerrado y uno nuevo abierto con ese estado —el equivalente
      de Playwright a cerrar y reabrir el navegador—, el valor sigue ahí.
- [x] Con la configuración por defecto y los cinco controles cambiados, el
      enlace generado por «Copiar enlace» es la URL limpia del sitio, sin
      un solo parámetro. Comprobado con Playwright: tras cambiar Campos y
      Orden en la ficha y volver a la clasificación, `window.location.search`
      de la URL raíz sigue vacío.
- [x] Abrir en un navegador con estado de vista propio guardado un enlace
      generado en otro con un estado de vista distinto: se ve el estado de
      vista **propio**, y la configuración del enlace. No hay una tercera
      fuente de precedencia para `ViewState` (requisito 5): un enlace nunca
      lo modifica, solo `localStorage` lo hace, así que este criterio se
      cumple por construcción — no hay código de precedencia con URL que
      pueda tener un error. Comprobado además que un contexto aislado con
      su propio «Orden» guardado lo conserva tras recargar, sin que la
      generación del enlace lo toque.
- [x] Escribir a mano un JSON corrupto en la clave del estado de vista y
      recargar: la ficha arranca con sus cinco valores por defecto, **la
      configuración guardada sigue intacta**, y hay una entrada de log con
      el motivo. Comprobado con Playwright, capturando la consola: con
      `comparador-coches:view` corrupto y `comparador-coches:config` con
      un peso distinto del por defecto, tras recargar el `<select>` de
      Campos vuelve a «Esenciales», la consola registra
      `view_state_discarded` con `reason: not_an_object`, y el peso
      guardado en `comparador-coches:config` sigue siendo el mismo.
- [x] Lo mismo con una `version` desconocida: se descarta entero, la
      configuración no se toca, y se registra. `viewState.test.ts`,
      «discards an unknown version entirely and logs the reason»: la
      clave de configuración ni se lee ni se escribe en esa ruta —son
      claves y funciones independientes en el puerto.
- [x] Escribir a mano un criterio de orden que no existe junto a un
      conjunto de campos válido y recargar: se descarta solo el orden, el
      conjunto de campos elegido se conserva, y se registra un único
      descarte. `viewState.test.ts`, «falls back to the default sort
      criterion and logs when unknown»: cada campo se restaura con su
      propia llamada a `restoreField`/`restoreEntityId`, así que un
      descarte no toca los demás.
- [x] Guardar como modelo de comparación un id que no está en el catálogo y
      recargar: la ficha arranca con la referencia por defecto, se registra
      el descarte, y los otros cuatro campos se conservan. `viewState.test.ts`,
      «falls back to the default comparison and logs when the id is not in
      the catalog», con `view_state_entity_discarded` y `entity.id` en los
      atributos.
- [x] Dejar «Comparar» en «Ninguno» y recargar: sigue en «Ninguno», y
      ninguna fila muestra Δ. Comprobado con Playwright: elegir la opción
      vacía del `<select>` «Comparar» y recargar deja el valor vacío, no
      la referencia por defecto. `viewState.test.ts`, «distinguishes an
      explicit "Ninguno" (null) from an absent field», confirma que es un
      valor guardado, no la ausencia de dato.
- [x] Desplegar una fila del ranking, recargar, y comprobar que ninguna
      queda desplegada. Comprobado con Playwright: `expandedId` sigue sin
      salir del `useState` local de `RankingList`, fuera de `ViewState`;
      tras desplegar la primera fila y recargar, ningún elemento tiene
      `aria-expanded="true"` en esa zona.
- [x] Por debajo de `--bp-columna`, abrir un panel plegable, recargar, y
      comprobar que está cerrado. Comprobado con Playwright a 390px: tras
      abrir el primer panel (`aria-expanded="true"`) y recargar, vuelve a
      `aria-expanded="false"` — `CollapsiblePanel` no se ha tocado.
- [x] Desplazar la tabla de la ficha en horizontal, recargar, y comprobar
      que arranca por el principio. Comprobado con Playwright: tras fijar
      `scrollLeft` a 353px y recargar, el contenedor no conserva ese valor
      — cae a 1px, el punto de anclaje del primer `scroll-snap-align` de
      `technical/0007`/`0008`, no a nada guardado. Nada en `ViewState` ni
      en el código de esta spec lee o escribe `scrollLeft`.
- [x] Abrir el diálogo de una foto, recargar, y comprobar que no hay ningún
      diálogo abierto. Comprobado con Playwright: tras abrir una foto
      (`dialog.open === true`) y recargar, `document.querySelector('dialog')`
      no tiene ningún diálogo abierto — `openPhoto` sigue en el `useState`
      local de `FichaPage`, fuera de `ViewState`.
- [x] «Restablecer» deja el almacenamiento local sin ninguna de las dos
      claves, y una recarga muestra los valores por defecto de las dos.
      Comprobado con Playwright: tras cambiar «Orden» en la ficha y pulsar
      «Restablecer» desde la clasificación, ni `comparador-coches:config`
      ni `comparador-coches:view` quedan en `localStorage`, y una
      recarga de la ficha vuelve a «Longitud».
- [x] Con el almacenamiento local deshabilitado, la aplicación arranca, la
      ficha se usa entera, no aparece ningún error al usuario, y hay **una
      sola** entrada de log por carga de página.
      `localStorageConfigPort.test.ts`, «logs once total across both
      storage keys, not once per key»: seis llamadas —cargar, guardar y
      borrar de las dos claves— con `localStorage` que lanza en cada
      acceso, y un único `console.error`, porque `logUnavailableOnce` es
      un único flag de módulo, no uno por clave.
- [x] Existe un test unitario del restaurador de `ViewState` que cubre:
      válido, corrupto, versión desconocida, valor fuera del conjunto
      admitido, identificador ausente del catálogo y comparación en
      «Ninguno». Entra en el suelo de cobertura del 100 %, por vivir en
      `src/domain/`. `src/domain/viewState.test.ts`, 100 % de líneas,
      sentencias, funciones y ramas (`npm run test:coverage`, 432 tests).
- [x] Cambiar los cinco controles añade **cero** entradas al historial del
      navegador. Comprobado con Playwright: `window.history.length` igual
      antes y después de mover los cuatro `<select>` de la barra; el
      quinto —el candidato enfocado— es un `setFocusedId` sin router ni
      URL de por medio, así que no puede añadir una entrada por
      construcción.
- [x] `npm run arch:check` pasa: ningún módulo de `src/domain/` importa el
      adaptador de almacenamiento ni conoce `window`. 115 módulos, 329
      dependencias, sin violaciones.
- [x] `package.json` no tiene ninguna dependencia nueva respecto a la rama
      base. `git diff main -- package.json package-lock.json` no muestra
      cambios.
- [x] `npm run format:check`, `npm run lint`, `npm run typecheck`,
      `npm run arch:check`, `npm run test:coverage` y `npm run build` pasan
      en local.

## Dependencias y supuestos

- **Enmienda `product/0012` sin editarla.** Aquella spec está
  `consolidated` y `docs/proceso/consolidacion.md` prohíbe tocarla. El
  precedente está sentado dos veces: `product/0016` amplió `product/0014`
  y `technical/0008` amplió `technical/0007`, las dos con una spec nueva.
  Al consolidarse, `docs/estado/interfaz.md` pasa a decir qué se recuerda y
  qué no, que es lo que se lee para saber cómo se comporta el sistema hoy.
- **Depende de las specs de la ficha solo en cuanto a qué controles
  existen.** `product/0018` y `technical/0010` fijan los cuatro de la
  barra, `product/0020` sus dos conjuntos de campos y `product/0023` el
  candidato enfocado. Si mañana se añade un quinto control, esta spec no lo
  cubre: lo cubrirá quien lo añada, o una enmienda a ésta.
- **El ADR 0007 fija que esto no es modelo de datos**, igual que la
  configuración: es estado de usuario serializado, sin fuentes y sin entrar
  en ninguna fórmula. No crea `docs/estado/datos.md`; se consolida en
  `docs/estado/interfaz.md`.
- Se asume `localStorage`, con la misma justificación que `product/0012`:
  síncrono, disponible en los navegadores objetivo y sin permiso. Dos
  claves en vez de una, bajo el mismo puerto.
- Se asume que el tamaño es despreciable: cinco campos cortos, muy por
  debajo de cualquier cuota.
- Se asume que esto son **datos del propio usuario en su propio
  navegador**: no hay datos de terceros, ni credenciales, ni salida de red,
  ni nada que justifique consentimiento. El nivel de autonomía es 🟡 por el
  modelado nuevo, no 🔴.
- Se asume que el catálogo sigue cambiando entre despliegues, que es lo que
  hace necesario el requisito 8. `product/0015` añade un segundo modo de
  desaparecer —despublicar— que cuenta igual que borrar.
- **No es tarea de ninguna fase abierta.** Entra en el roadmap como alcance
  nuevo, en *Más adelante*.

## Decisiones abiertas

Ninguna.
