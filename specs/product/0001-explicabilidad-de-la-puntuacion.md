# 0001 — Explicabilidad de la puntuación y trazabilidad de fuentes

- **Id:** product/0001
- **Estado:** draft
- **Tipo:** product
- **Fecha:** 2026-08-02
- **Specs relacionadas:** technical/0001
- **ADRs relacionados:** 0003
- **Doc de estado:** `docs/estado/dominio.md`, `docs/estado/interfaz.md` (se
  crea al consolidar)

## Contexto

El comparador existe hoy como artefacto React de un solo fichero. Muestra un
ranking y, en una fila desplegable, el desglose por ejes con barras y el
desglose del coste en euros. Lo que **no** muestra es de dónde sale cada
número: ni el dato de partida, ni su fuente, ni contra qué se normalizó, ni
qué supuestos se aplicaron.

Eso lo vuelve poco auditable justo donde importa. La normalización de cada eje
se calcula sobre el conjunto de candidatos, no en abstracto: un 7,3 no
significa nada sin saber cuáles son el mínimo y el máximo y qué modelo ocupa
cada extremo. Y los datos del catálogo mezclan verificados con estimaciones —
alturas libres, aceleraciones, valores residuales, fiabilidad de Alfa Romeo—
sin que el usuario pueda distinguirlos al leer un resultado.

La propia especificación del proyecto identifica la trazabilidad de fuentes
como el punto más débil del artefacto actual.

## Objetivo

Que cualquier puntuación del comparador se pueda auditar hasta sus datos de
partida y sus fuentes, sin salir de la aplicación y sin conocer las fórmulas
de antemano.

## Alcance

- **Desglose por eje y modelo**, con: datos de entrada, supuestos aplicados,
  pasos intermedios, valor crudo, normalización, penalizaciones, peso y
  aportación al total.
- **Identificación de los extremos de normalización**: qué modelo marca el
  mínimo y cuál el máximo de cada eje, con su valor.
- **Fórmula de cada eje visible**, declarada junto al cálculo y no como texto
  independiente en la interfaz.
- **Procedencia por dato**: cada valor del catálogo lleva su fuente y su marca
  de estimado, y ambas viajan hasta el desglose.
- **Supuestos globales explícitos** —km/año, años de vida, precio del litro y
  del kWh, mezcla estética, ponderación de la dificultad de uso diario— con
  sus valores vigentes visibles allí donde afectan.
- **Penalizaciones como línea propia**: las condicionales a eléctricos
  aparecen con su condición y su efecto, no restadas de antemano.

## Fuera de alcance

- **Objetivar el eje de viaje.** Sigue siendo un juicio, y esta spec no lo
  cambia: se limita a mostrarlo marcado como tal.
- **Añadir el eje subjetivo de conducción**, reservado a después de las
  pruebas de los coches.
- **Corregir o completar los datos del catálogo.** Esta spec fija cómo se
  declaran fuente y estimación, no qué valores son correctos.
- **Comparar configuraciones distintas entre sí** o guardar históricos.
- **Cambiar las fórmulas vigentes.** Se muestran; no se tocan.

## Requisitos / comportamiento esperado

1. El núcleo de puntuación devuelve, para cada modelo y eje, una estructura de
   desglose de la que la puntuación es un campo. No expone una función que
   devuelva únicamente la puntuación.
2. La interfaz no calcula ninguna parte de la puntuación: solo renderiza el
   desglose que recibe.
3. Cada dato de entrada del desglose indica su valor, su unidad, su fuente y
   si es una estimación.
4. Cada eje indica la dirección de su normalización —mayor es mejor o menor es
   mejor—, el mínimo y el máximo del conjunto de candidatos, y qué modelo
   ocupa cada extremo.
5. Los ejes con fórmula compuesta (prestaciones, fiabilidad, estética, coste)
   desglosan cada sumando con su propia normalización antes de combinarlos.
6. Las penalizaciones condicionales figuran como línea explícita con su
   condición, su estado —activa o no— y su efecto en puntos.
7. El desglose indica el peso del eje y su aportación al total, de forma que
   la suma de aportaciones reproduzca la puntuación final.
8. Los supuestos globales vigentes se muestran junto a los ejes que dependen
   de ellos.
9. La descripción de la fórmula de un eje procede de la misma declaración que
   gobierna su cálculo.
10. Un dato sin fuente declarada es un error de carga del catálogo, no un dato
    con la fuente vacía.

## Criterios de aceptación

> Obligatorios y verificables.

- [ ] Para cualquier modelo y cualquiera de los seis ejes, la interfaz muestra
      datos de entrada, supuestos, pasos intermedios, valor crudo,
      normalización, penalizaciones, peso y aportación.
- [ ] En cada eje se identifican por nombre el modelo que marca el mínimo y el
      que marca el máximo, junto con sus valores.
- [ ] Todo dato mostrado en un desglose lleva su fuente, y los estimados
      aparecen distinguidos de los verificados.
- [ ] La suma de las aportaciones de los seis ejes coincide con la puntuación
      total del modelo, con tolerancia de redondeo declarada.
- [ ] Con las penalizaciones de eléctricos activas, el desglose de un modelo
      eléctrico las muestra como línea propia con su condición y su efecto.
- [ ] Cargar un catálogo en el que un dato carece de fuente hace fallar la
      carga con un error que identifica el dato.
- [ ] Existe un test que, para un modelo y un eje, comprueba el desglose
      completo y no solo la puntuación.
- [ ] Ningún módulo de la interfaz reproduce una fórmula de puntuación; la
      regla de dependencias de CI lo impide.

## Dependencias y supuestos

- Depende de `technical/0001`, que establece el proyecto, la estructura de
  carpetas y la regla de dependencias que hace verificable el último criterio.
- Se asume que el catálogo se sigue editando a mano en el repositorio y que la
  fuente de cada dato es conocida en el momento de introducirlo.
- Se asume que los once candidatos y las fórmulas vigentes son los descritos
  en la especificación del proyecto, sin cambios.

## Decisiones abiertas

- Cómo se declara la fuente cuando un dato procede de varias —por ejemplo, un
  maletero contrastado contra dos mediciones independientes—: una fuente
  principal con notas, o una lista de fuentes por dato.
- Si los supuestos globales se muestran solo en los ejes que los usan o
  también en un panel único, cuando ambos sitios los pueden mostrar.
