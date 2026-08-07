# Buscar y verificar las 5 fotos de un modelo

Este es el flujo que de verdad funcionó al rellenar las fotos de los doce
modelos de `product/0014` — no una descripción teórica.

## De dónde puede salir una foto

Lo fija `product/0016`, y son **cuatro orígenes en orden de preferencia**:

1. **La sala de prensa del fabricante** (Kia Press, Hyundai Newsroom,
   Stellantis Media, BMW PressClub, Honda Press, Toyota/Lexus Media…). Son
   imágenes publicadas para que se reproduzcan al hablar del coche, y las
   que con más seguridad enseñan la versión correcta.
2. **Wikimedia Commons** y repositorios de licencia libre equivalentes. La
   opción más limpia cuando tiene la vista que hace falta, y la única con
   API cómoda — por eso el resto de esta guía la usa como ejemplo.
3. **El configurador o la web comercial del fabricante**, si la sala de
   prensa no llega.
4. **Importadores nacionales y concesionarios oficiales.** Los últimos, pero
   **son los que fotografían stock real y por tanto casi los únicos que
   enseñan el maletero abierto**. Si buscas maletero, ve aquí pronto: en
   Commons prácticamente no existe esa vista.

Fuera quedan, y no es negociable sin decisión humana escrita: agencias y
bancos de imágenes (Getty, Shutterstock), prensa con marca de agua, y fotos
de particulares en foros, redes o anuncios de compraventa.

**Enlazar, nunca copiar.** El repositorio no aloja ninguna imagen. Es la
distinción sobre la que se sostiene todo lo anterior.

## Qué se escribe en `credit`

- Con licencia con nombre: `"Wikimedia Commons — <Autor> (<Licencia>)"`.
- Sin licencia con nombre —el caso normal fuera de Commons—: el titular y el
  medio, `"Kia Press (medio oficial de Kia)"`. Si es un concesionario,
  **nómbralo**, no pongas «un concesionario».
- **Nunca inventes una licencia.** Escribir «CC BY» donde la fuente no
  declara nada es peor que no escribir licencia, porque le da a quien lo lea
  después una seguridad que no existe.

## Las cinco vistas y su encuadre

| Vista | Clave en `photos` | Qué tiene que enseñar |
| --- | --- | --- |
| Frontal | `front` | Recto, coche centrado, ruedas rectas. Un 3/4 no vale. |
| Lateral | `side` | Lo más cercano a 90º que encuentres. Si tras buscar en serio no aparece un perfil estricto, vale una foto "casi perfil" —coche entero visible, poco escorzo— pero nunca un 3/4 claro etiquetado como si fuera lateral. |
| Trasera | `rear` | Con el portón/maletero **cerrado**. |
| Maletero | `trunk` | Portón **abierto**, maletero **vacío**, asientos traseros **sin abatir**. Es la vista más difícil de encontrar: la mayoría de fotografía de aficionado no la incluye. Empieza por concesionarios (origen 4). |
| Interior | `interior` | Vista general del habitáculo delantero —salpicadero, volante, consola—, no un detalle de una sola pieza. |

Una vista que no se encuentra con confianza razonable se deja **vacía**, no
se rellena con lo más parecido que haya. El esquema (`PhotoSchema`,
`src/domain/photo.ts`) no exige mínimo de vistas por coche.

**La versión manda... salvo en maletero e interior.** La regla general es que
la foto sea del modelo y la motorización que puntúa la ficha. `product/0016`
abre una excepción **solo en esas dos vistas**: vale otro acabado o
motorización del mismo modelo y generación, siempre que **`shows` lo diga** y
que el acabado no cambie lo que se ve (si la tapicería es de otro material, o
el maletero lleva doble fondo distinto, no vale). En frontal, lateral y
trasera no hay excepción: ahí las llantas y los faldones cambian justo lo que
esta aplicación existe para comparar.

## Buscar en Wikimedia Commons

Lo que sigue es específico de Commons, que es el origen 2 y el único con API
pública cómoda. Para los orígenes 1, 3 y 4 no hay API: se busca en la web del
medio y se coge la URL de la imagen a tamaño grande, con las mismas reglas de
verificación —**mirarla** y comprobar la versión— y el `credit` de arriba.

La API es `https://commons.wikimedia.org/w/api.php`. Dos formas de buscar,
según lo que sepas del coche:

```bash
# Por categoría, si conoces el nombre exacto (marca + generación/código de chasis)
curl -sS -H "User-Agent: comparador-coches-research/1.0" \
  "https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Kia%20EV3&cmlimit=300&format=json"

# Por texto libre, si no conoces la categoría
curl -sS -H "User-Agent: comparador-coches-research/1.0" \
  "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=Kia%20EV3&srnamespace=6&format=json&srlimit=30"
```

**La cabecera `User-Agent` no es opcional**: sin ella la API responde peor
o directamente bloquea. Usa siempre una descriptiva, no la que trae `curl`
por defecto.

Busca sobre todo **sets sistemáticos** de un mismo coche y color: fotos de
concesionario o salón, numeradas `(1).jpg` hasta `(N).jpg`, o con sufijos
explícitos `front`/`rear`/`side`/`interior`/`trunk`, o en alemán
`– f`/`– h` (*vorne*/*heck*, frontal/trasera). Son con diferencia la
fuente más fiable para cubrir varias vistas del mismo coche sin mezclar
generaciones ni colores sin darte cuenta, y en más de un caso han traído
las cinco vistas —maletero incluido— de un único fotógrafo.

## El límite de peticiones

Wikimedia devuelve `429 "You are making too many requests"` con bastante
facilidad. Dos técnicas que evitan perder el tiempo reintentando a ciegas:

1. **Agrupa varios títulos en una sola llamada**, con `|` codificado como
   `%7C`:

   ```bash
   curl -sS -H "User-Agent: comparador-coches-research/1.0" \
     "https://commons.wikimedia.org/w/api.php?action=query&titles=File:A.jpg%7CFile:B.jpg%7CFile:C.jpg&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1200&format=json"
   ```

   Cuatro títulos en una llamada consumen la cuota de una, no de cuatro.

2. **Si aparece el 429, no reintentes con `sleep` fijos** — el límite tarda
   variable en despejarse. Usa un bucle de espera con reintento (la
   herramienta `Monitor`, si está disponible, o un `until` en background)
   que compruebe cada 10-15s con una llamada barata
   (`action=query&meta=siteinfo&format=json`) hasta que responda 200, y
   sigue con otra cosa mientras tanto en vez de bloquear la sesión entera
   esperando.

## Verificar antes de aceptar

1. Descarga la candidata a **miniatura** (no el original a máxima
   resolución) con `iiprop=url&iiurlwidth=350` o similar, a un directorio
   temporal.
2. **Míra la imagen de verdad** antes de aceptarla — el nombre de fichero
   "front"/"side"/"rear" no siempre coincide con lo que la foto enseña de
   verdad; en la práctica ha hecho falta descartar candidatas por eso más
   de una vez.
3. Comprueba que el coche de la foto es la **generación y motorización**
   correctas — mira las categorías o la descripción de la página del
   fichero si hay duda (`prop=imageinfo&iiprop=url|extmetadata`, campo
   `Categories`). El caso real que ya ha pasado: buscar
   "BMW X1 xDrive25e" trajo fotos etiquetadas igual pero de la generación
   F48 anterior, no la U11 actual — verificarlo antes de aceptar evitó
   colar el coche equivocado.

## Construir `credit` y `shows`

Con la candidata aceptada, pide `imageinfo` con `iiprop=url|extmetadata` y
un ancho de **1200-1280px** (no el original, que puede pesar varios MB):

```bash
curl -sS -H "User-Agent: comparador-coches-research/1.0" \
  "https://commons.wikimedia.org/w/api.php?action=query&titles=File:Kia_EV3_Earth_SV1_Snow_White_Pearl_(1).jpg&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1200&format=json"
```

De la respuesta:

- `url` del coche = el `thumburl` (quita los parámetros `?utm_...` del
  final, son de seguimiento y no hacen falta para que la imagen cargue).
- `credit` = `"Wikimedia Commons — <Artist> (<LicenseShortName>)"`, leyendo
  esos dos campos de `extmetadata`.
- `shows` = qué se ve de verdad: color, acabado si es identificable, y
  cualquier cosa que no coincida con las otras fotos del mismo coche (por
  ejemplo, si el interior es de un color de tapicería distinto al exterior
  fotografiado, dilo explícitamente — no dejes que parezca el mismo coche
  si no lo es).

## Verificación final

Cuando termines de añadir fotos, corre `npm run check:photos` y confirma
que todas responden 2xx — no solo las nuevas, el script comprueba el
catálogo entero. Una URL que devuelve 404 o 403 en la verificación final no
se deja "para luego": o se sustituye por otra candidata, o la vista se
deja vacía.

Fuera de Commons esto se vuelve más importante, no menos:

- **Quita los parámetros de seguimiento** (`?utm_...` y equivalentes) de la
  URL antes de guardarla.
- **Un 403 suele ser bloqueo por `Referer`**, no un enlace roto: la
  aplicación pide las miniaturas con `referrerpolicy="no-referrer"` y hay
  medios que lo rechazan. Si pasa, **descarta esa foto y busca otra**; no se
  toca la política de *referrer* de toda la aplicación por una imagen
  (`product/0016`, requisito 4.1).
- **Los enlaces de configuradores y concesionarios caducan** mucho antes que
  los de Commons. Son los primeros que hay que sospechar cuando
  `check:photos` se ponga rojo sin que nadie haya tocado el catálogo.
