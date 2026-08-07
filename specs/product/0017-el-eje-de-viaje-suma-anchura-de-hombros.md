# 0017 — El eje de viaje suma una tercera magnitud: anchura de hombros

- **Id:** product/0017
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-07
- **Specs relacionadas:** product/0005
- **ADRs relacionados:** 0004
- **Doc de estado:** `docs/estado/dominio.md`

## Contexto

`product/0005` (consolidada) sacó el eje `viaje` de una valoración subjetiva
y lo ancló en dos magnitudes medidas: capacidad de maletero (60%) y batalla
(40%). La propia spec ya avisaba de que la batalla es un proxy flojo del
espacio para los ocupantes de atrás — «los once candidatos caben en 179 mm»
— y lo justificaba solo porque era «el único proxy publicado» disponible en
ese momento.

Desde entonces sigue sin haber una magnitud que mida directamente si dos
personas caben hombro con hombro en la plaza trasera sin agolparse, que es
justo lo que la batalla mide de forma indirecta. Este cambio lo añade.

Aparte, el esquema (`Car`) sigue arrastrando `travelComfort`: una
valoración 1-5 subjetiva que `product/0005` dejó de usar en la puntuación
del eje `viaje` pero que nunca se retiró del modelo. Hoy solo sobrevive
como una fila suelta («Confort de viaje») en el bloque «Juicio propio» de
la ficha completa, sin aportar nada al ranking. `product/0005` dejó
explícitamente esta decisión para una spec técnica posterior — esta spec
la toma.

## Objetivo

Que el eje `viaje` incorpore una tercera magnitud —anchura interior en la
plaza trasera, medida a la altura de los hombros— con su propia escala
absoluta, y que el campo `travelComfort`, ya sin uso real, se retire del
modelo.

## Alcance

- **Una magnitud nueva**: anchura interior de la segunda fila de asientos,
  medida a la altura de los hombros, con su escala absoluta.
- **Un reparto nuevo entre las tres magnitudes** del eje `viaje`: 50%
  maletero / 25% batalla / 25% anchura de hombros.
- **La retirada completa de `travelComfort`** del esquema (`CarSchema`),
  de `cars.json`, del sistema de overrides (`EDITABLE_RATING_FIELDS`), del
  desglose de puntuación y de la ficha completa (bloque «Juicio propio»).
- **Una columna nueva en el catálogo** para los candidatos publicados hoy,
  con su fuente real.

## Fuera de alcance

- **Anchura en plazas delanteras.** El eje mide espacio para los
  ocupantes de atrás, igual que la batalla; la anchura delantera es otra
  pregunta.
- **`aestheticsExterior` y `aestheticsInterior`.** Siguen exactamente
  igual: valoraciones subjetivas sin anclaje externo, porque el eje
  `estetica` es del tipo «preferencia», no «afirmación sobre el mundo»
  (`docs/proceso/calibracion-de-escalas.md`, sección 4).
- **El peso del eje `viaje` sobre el total** (sigue en 4/13). Esta spec
  solo cambia cómo se reparte ese peso *dentro* del eje.
- **Un «hip room» en el sentido estricto (norma SAE, altura de cadera).**
  No está publicado para el mercado español en las fuentes que ya usa este
  catálogo (motor.es, km77) — km77 mide a la altura de los hombros, no de
  la cadera, y es lo que esta spec usa como sustituto documentado, no como
  equivalente exacto.

## Las tres escalas

| Magnitud | Nota 10 | Nota 0 |
| --- | --- | --- |
| Capacidad de maletero | desde 620 L | hasta 250 L |
| Batalla | desde 2.850 mm | hasta 2.400 mm |
| Anchura de hombros (2ª fila) | **desde 1.390 mm** | **hasta 1.310 mm** |

Las dos primeras no cambian respecto a `product/0005`. Entre anclajes, la
misma curva en S: `nota = 10 × (1 − t²(3 − 2t))`.

### De dónde sale la magnitud

**Fuente**: km77.com, ficha «mediciones propias» de cada modelo, fila
«Anchura» de la segunda fila de asientos — medida, según su propia
metodología, a la altura de los hombros. Es la misma familia de fuente
independiente que ya usa el resto del catálogo para batalla (motor.es) y
sigue el mismo principio: una fuente publicada y nombrada, nunca de
memoria.

### De dónde salen los anclajes

Calibrados contra los mismos coches de referencia que ya fijaron maletero
y batalla en `product/0005`, para que las tres escalas compartan
metodología:

| Modelo | Anchura hombros (2ª fila) | Fuente |
| --- | --- | --- |
| Skoda Superb (berlina, Selection 1.5 TSI mHEV 150 CV DSG, 2024) | **1.390 mm** | [km77](https://www.km77.com/coches/skoda/superb/2024/berlina/mediciones-propias) |
| Dacia Sandero (estándar, 2021) | **1.310 mm** | [km77](https://www.km77.com/coches/dacia/sandero/2021/estandar/mediciones-propias) |
| Alfa Romeo Giulietta (estándar, 2014) | **1.310 mm** | [km77](https://www.km77.com/coches/alfa-romeo/giulietta/2014/estandar/mediciones-propias) |

El maletero VDA que muestran estas mismas fichas de km77 coincide con los
anclajes de maletero de `product/0005` (Sandero 328 L exacto; Superb Combi
510-690 L; Giulietta 275-350 L), lo que da confianza en que son las mismas
versiones que ya se usaron para calibrar las otras dos magnitudes.

**El recorrido es corto a propósito: 80 mm.** Es una magnitud con poco
rango real entre un utilitario y un familiar grande — mucho menos que el
maletero (370 L) o la batalla (450 mm) — y conviene decirlo tal como
`product/0005` lo dijo de la batalla: va a aportar matiz, no a decidir por
sí sola.

## Dónde caen los candidatos

| Coche | Anchura hombros | Nota | Fuente |
| --- | --- | --- | --- |
| Kia EV3 | 1.340 mm | 3,2 | [km77](https://www.km77.com/coches/kia/ev3/2025/estandar/mediciones-propias/detalle) |
| Toyota Corolla Cross HEV | 1.350 mm | 5,0 | [km77](https://www.km77.com/coches/toyota/corolla-cross/2023/estandar/estandar/corolla-cross-style-18-hybrid/mediciones-propias/detalle) |
| Alfa Romeo Tonale | 1.370 mm | 8,4 | [km77](https://www.km77.com/coches/alfa-romeo/tonale/2022/estandar/mediciones-propias/detalle) |
| Hyundai Kona HEV | 1.380 mm | 9,6 | [km77](https://www.km77.com/coches/hyundai/kona/2023/estandar/hibrido/kona-n-line-style-hibrido-16-gdi-129-cv/mediciones-propias/detalle) |
| Hyundai Kona Eléctrico | 1.380 mm | 9,6 | [km77](https://www.km77.com/coches/hyundai/kona/2023/estandar/electric/kona-electrico-204-cv-65-kwh-tecno/mediciones-propias/detalle) |
| BMW X1 xDrive25e | 1.380 mm | 9,6 | [km77](https://www.km77.com/coches/bmw/x1/2023/estandar/e/x1-xdrive25e/mediciones-propias/detalle) |
| Lexus NX 350h | 1.380 mm | 9,6 | [km77](https://www.km77.com/coches/lexus/nx/2022/estandar/hev/nx-350h-4wd-business/mediciones-propias/detalle) |
| Kia Sportage HEV | 1.390 mm | 10,0 | [km77](https://www.km77.com/coches/kia/sportage/2022/estandar/hev/mediciones-propias) |
| Mazda CX-5 | 1.390 mm | 10,0 | [km77](https://www.km77.com/coches/mazda/cx-5/2022/estandar/estandar/cx-5-20-e-skyactiv-g-mhev-121-kw-165-cv-2wd-takumi/mediciones-propias/detalle) |
| Honda Civic e:HEV | 1.420 mm | 10,0 (saturado) | [km77](https://www.km77.com/coches/honda/civic/2023/5-puertas/hev/civic-ehev-advance/mediciones-propias/detalle) |
| Honda CR-V e:HEV | 1.420 mm | 10,0 (saturado) | [km77](https://www.km77.com/coches/honda/cr-v/2024/estandar/hev/cr-v-elegance-full-hybrid-4x4/mediciones-propias/detalle) |

**Cuatro de los once candidatos saturan la nota máxima**, y dos de ellos
(Civic, CR-V, 1.420 mm) superan al propio Skoda Superb de referencia
(1.390 mm). Ver «Decisiones abiertas» — es exactamente el tipo de señal
que `docs/proceso/calibracion-de-escalas.md` pide comprobar antes de dar
un anclaje por bueno.

## Requisitos / comportamiento esperado

1. La anchura de hombros se puntúa contra su escala absoluta: nota 10
   desde 1.390 mm, nota 0 hasta 1.310 mm, curva en S entre ambos.
2. El eje `viaje` combina las tres magnitudes: `0,5 × escala(maletero) +
   0,25 × escala(batalla) + 0,25 × escala(anchura de hombros)`.
3. Ninguna nota de este eje depende de qué otros coches haya en el
   catálogo.
4. El desglose del eje `viaje` muestra las tres magnitudes —valor,
   anclajes y nota de cada una—, no solo dos.
5. El campo `travelComfort` desaparece de `CarSchema`, de todos los
   registros de `cars.json`, de `EDITABLE_RATING_FIELDS` (overrides), y
   del bloque «Juicio propio» de la ficha completa.
6. Ningún test sigue referenciando `travelComfort` tras el cambio.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Un coche con 1.390 mm de anchura de hombros o más saca un 10 en esa
      magnitud, y uno con 1.310 mm o menos saca un 0.
- [ ] Un coche en el punto medio de la escala (1.350 mm) saca un 5,0.
- [ ] La nota del eje `viaje` de un coche es la misma con once candidatos
      en el catálogo que con uno solo.
- [ ] El desglose del eje `viaje` muestra las tres magnitudes con su
      valor, sus dos anclajes y su nota.
- [ ] `travelComfort` no aparece en `CarSchema`, `cars.json`,
      `EDITABLE_RATING_FIELDS`, la ficha completa, ni en ningún test del
      repositorio.
- [ ] Los candidatos publicados en el momento de implementar llevan la
      anchura de hombros con fuente real citada (km77).
- [ ] `npm run test:coverage` sigue en 100% tras el cambio.

## Dependencias y supuestos

- Depende del ADR 0004 (principio de escalas absolutas) y sucede a
  `product/0005`, que dejó abierta la decisión sobre `travelComfort`.
- **El catálogo necesita una columna nueva** para los candidatos
  publicados hoy (ocho) y para los tres despublicados por presupuesto
  (BMW X1 xDrive25e, Lexus NX 350h, Honda CR-V e:HEV) si en algún momento
  se republican — todos con fuente km77 citada explícitamente. Los valores
  propuestos están en la tabla «Dónde caen los candidatos» de esta spec.
- Los coches que se den de alta **después** de que esta spec quede
  `approved` deben incluir el campo nuevo desde el alta; los que se den de
  alta **antes** (mientras esta spec sigue en `draft`) se añaden sin él,
  siguiendo el esquema vigente hoy, y quedan como deuda de migración en
  `docs/roadmap.md` hasta que esta spec se implemente.

## Decisiones abiertas

- **Verificación manual de las cifras de km77.** Se han obtenido con
  `WebFetch` (un modelo intermedio leyendo el HTML de cada ficha), no
  contrastadas a ojo contra una captura de cada tabla. Antes de aprobar,
  alguien debería confirmar al menos 2-3 —incluidas las tres de
  referencia— abriendo la URL directamente.
- **La saturación en el anclaje bueno.** Cuatro de once candidatos sacan
  10,0, y dos (Civic, CR-V) superan al Skoda Superb de referencia. Decidir
  si se acepta —como ya se aceptó que la batalla «aporte poco»— o si
  conviene buscar una referencia con más anchura de hombros que el Superb
  para que el anclaje bueno vuelva a ser «a partir de aquí deja de
  mejorar» de verdad.
- **Versión no exactamente coincidente con la fuente de motor.es** en
  cinco candidatos (Kona HEV, Kona Eléctrico, Alfa Romeo Tonale, Kia
  Sportage HEV, Lexus NX 350h): km77 no publica una ficha «mediciones
  propias» de la motorización/acabado exacto que usa el resto de la ficha
  de esos coches; se ha usado la más cercana disponible. Detalle
  version-a-versión en el registro de la investigación, no reproducido
  aquí para no duplicarlo — confirmar si es aceptable o si hace falta
  seguir buscando la versión exacta.
- **Nombre final del campo** en `CarSchema` — esta spec no lo fija
  (propuesta de trabajo: `rearShoulderWidthMm`); lo decide la spec técnica
  que implemente esto.
