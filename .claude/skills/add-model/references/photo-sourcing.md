# Buscar y verificar las 5 fotos de un modelo

Este es el flujo que de verdad funcionó al rellenar las fotos de los doce
modelos de `product/0014` — no una descripción teórica. Se apoya en la API
pública de Wikimedia Commons porque aloja fotografía verificable, con
autoría y licencia claras, y con licencias que permiten enlazar sin copiar
el archivo al repositorio (`product/0014`, decisión: enlazar, no copiar).

## Las cinco vistas y su encuadre

| Vista | Clave en `photos` | Qué tiene que enseñar |
| --- | --- | --- |
| Frontal | `front` | Recto, coche centrado, ruedas rectas. Un 3/4 no vale. |
| Lateral | `side` | Lo más cercano a 90º que encuentres. Si tras buscar en serio no aparece un perfil estricto, vale una foto "casi perfil" —coche entero visible, poco escorzo— pero nunca un 3/4 claro etiquetado como si fuera lateral. |
| Trasera | `rear` | Con el portón/maletero **cerrado**. |
| Maletero | `trunk` | Portón **abierto**, maletero **vacío**, asientos traseros **sin abatir**. Es la vista más difícil de encontrar: la mayoría de fotografía de aficionado no la incluye. |
| Interior | `interior` | Vista general del habitáculo delantero —salpicadero, volante, consola—, no un detalle de una sola pieza. |

Una vista que no se encuentra con confianza razonable se deja **vacía**, no
se rellena con lo más parecido que haya. El esquema (`PhotoSchema`,
`src/domain/photo.ts`) no exige mínimo de vistas por coche.

## Buscar en Wikimedia Commons

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
