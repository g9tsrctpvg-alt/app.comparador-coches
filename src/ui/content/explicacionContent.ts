import type { AxisId } from '../../domain/scoring/weights';

/**
 * La prosa explicativa —el porqué— de la página «Cómo se calcula todo»
 * (product/0011, requisito 4). Vive aquí, separada de los componentes que
 * la renderizan, y no en `docs/estado/dominio.md`: son dos audiencias
 * distintas y no se generan una de la otra.
 *
 * Lo que **no** vive aquí son los valores —nombres de eje, pesos,
 * supuestos, y el valor de cada anclaje—: esos se leen en la página
 * directamente de `src/domain/scoring/`, vía `scoreCatalog`, para que
 * cambiarlos en el dominio cambie la página sin tocar este fichero. Por
 * eso `anchorReasoning` es un array posicional, no un mapa por etiqueta:
 * empareja con `AxisBreakdown.subcomponents` por índice, nunca por el
 * texto de una etiqueta que pueda reescribirse.
 */
export interface AxisContent {
  measures: string;
  data: string;
  anchorReasoning: string[];
  /** `estetica` y `prueba`: por qué son los únicos ejes sin curva en S. */
  curveException?: string;
}

export const AXIS_CONTENT: Record<AxisId, AxisContent> = {
  carga: {
    measures: 'Cuánto equipaje entra en el coche.',
    data: 'Litros de maletero.',
    anchorReasoning: [
      'El techo lo marca el Škoda Kodiaq —910 L a cinco plazas—, el maletero generalista más grande del mercado. El suelo lo pone el Fiat 500 Hybrid —185 L—: los dos anclajes son extremos del mercado, no de la gama que se compara (ADR 0010).',
    ],
  },
  habitabilidad: {
    measures: 'El sitio para las piernas y los hombros de quien va detrás.',
    data: 'Batalla (la distancia entre ejes, que aproxima el espacio interior) y anchura de hombros de la segunda fila.',
    anchorReasoning: [
      'El BMW i7 marca el techo de batalla —3.215 mm— y el Kia Picanto el suelo —2.400 mm, la batalla más corta a la venta—: los dos anclajes son extremos del mercado, no de la gama que se compara (ADR 0010).',
      'El Mercedes Clase E marca el techo —146 cm de hombros en la segunda fila, según las mediciones de km77—; el Kia Picanto el suelo —126 cm—. Pesa lo mismo que la batalla —la mitad cada una— porque mide el mismo tipo de espacio de los que van atrás, a lo ancho en vez de a lo largo, y es igual de gradual.',
    ],
  },
  diario: {
    measures:
      'Qué tan fácil es usar el coche en el día a día: aparcarlo, moverlo por ciudad, meterlo en un hueco estrecho.',
    data: 'Anchura y longitud de carrocería, sin espejos.',
    anchorReasoning: [
      'El Kia Picanto —1.595 mm— marca el suelo del mercado: nada más estrecho se vende como turismo. 2.000 mm es el techo real —Range Rover y BMW X7 lo rozan por los dos lados—, así que ninguno de los dos anclajes es un umbral inventado (ADR 0010).',
      'Mismo Picanto abajo —3.605 mm, el turismo más corto a la venta—. Arriba, el BMW i7 —5.391 mm— pone el techo real del mercado, no el tamaño de una plaza de aparcamiento.',
    ],
  },
  prestaciones: {
    measures:
      'Cuánto empuje tiene el coche: potencia relativa al peso y aceleración.',
    data: 'CV por tonelada, y aceleración de 0 a 100 km/h.',
    anchorReasoning: [
      'El suelo lo pone el Dacia Sandero SCe 65 (67 CV, 1.012 kg, 66,2 CV/t): el coche más barato del mercado. El techo lo pone el Tesla Model 3 Gran Autonomía 4WD (498 CV, 1.899 kg, 262,2 CV/t): una berlina de venta normal, no una versión de prestaciones — el universo de este eje excluye deportivos y superdeportivos (ADR 0010).',
      'Los mismos dos coches por los dos extremos: 16,7 s el Sandero, 4,4 s el Model 3.',
    ],
  },
  fiabilidad: {
    measures:
      'Cuánto se puede confiar en el coche: fiabilidad de la marca y años de garantía.',
    data: 'Índice de fiabilidad de la OCU (por marca, no por modelo) y años de garantía incondicional.',
    anchorReasoning: [
      'Son los extremos que la propia OCU publica sobre 39 marcas —Lexus arriba, Land Rover abajo—: la escala es el mercado tal como se publica, sin ningún recorte que justificar.',
      'El 10 va en el techo real del mercado sin condiciones —Kia, MG, Omoda, Jaecoo—. El 0 va en 0 años y no en los 3 del mínimo legal español: quedarse en el mínimo es una estrategia comercial, no una señal de que el coche se rompe. Una extensión de garantía sujeta a mantenimiento en red oficial no cuenta para esta nota: es un compromiso del comprador, no del fabricante, y el desglose de cada coche la muestra aparte, como información que no puntúa.',
    ],
  },
  estetica: {
    measures: 'Cuánto gusta el diseño, exterior e interior.',
    data: 'Tu propia valoración de 1 a 5 para el exterior y para el interior: es el único eje que editas tú directamente, no un dato del catálogo.',
    anchorReasoning: [
      'Es tu juicio completo: 1 significa «no hay nada que salvar», 5 significa «tan guapo como hace falta». No hay una referencia externa que razonar, porque la referencia eres tú.',
      'La misma escala se aplica al interior. La mezcla entre exterior e interior es un supuesto global, no algo que decida este eje.',
    ],
    curveException:
      'Es el único eje sin curva en S. Tu valoración de 1 a 5 ya es tu juicio completo, y comprimir los extremos con la misma curva que usan los milímetros o los euros lo deformaría dos veces. Por eso aquí la nota es una línea recta: el 1 vale 0, el 5 vale 10, y los pasos intermedios se reparten por igual.',
  },
  prueba: {
    measures:
      'Lo que solo se sabe sentado dentro: postura, ruido, visibilidad, plazas de atrás y maletero por dentro.',
    data: 'La media de cinco juicios de 1 a 5 que anotas tú mismo en la hoja de visita de cada coche, tras probarlo: el segundo eje que editas directamente, no un dato del catálogo. Un coche sin probar puntúa el punto medio de la escala, ni a favor ni en contra.',
    anchorReasoning: [
      'Postura al volante: 1 es «no me pongo cómodo ni a los diez minutos», 5 es «asiento, volante y pedales caen donde tienen que caer».',
      'Ruido: 1 es «no se aguanta una autovía larga», 5 es «se conversa sin subir la voz».',
      'Visibilidad: 1 es «los pilares tapan lo que hace falta ver», 5 es «se maniobra sin sorpresas».',
      'Plazas de atrás: 1 es «un adulto detrás de otro adulto no cabe», 5 es «cabe con margen, plaza central incluida».',
      'Maletero por dentro: 1 es «la forma o el escalón de carga estorban», 5 es «se aprovecha bien y se carga sin esfuerzo».',
    ],
    curveException:
      'Es el otro eje sin curva en S. Cada juicio de 1 a 5 ya es tu valoración completa, con el mismo motivo que la estética: comprimir los extremos con la misma curva que usan los milímetros o los euros lo deformaría dos veces. La nota es una línea recta, y un juicio sin contestar puntúa el 3 central (ADR 0012).',
  },
  coste: {
    measures: 'Cuánto cuesta el coche: de compra y de uso mensual.',
    data: 'Precio de compra, y un coste de uso mensual calculado a partir del consumo, los km/año, el precio del combustible o de la electricidad, y el mantenimiento anual.',
    anchorReasoning: [
      'El presupuesto ya declarado —el mismo que se puede ajustar en el panel de supuestos— es el techo duro: por encima, no se compra. Por debajo del otro anclaje, el precio deja de preocupar.',
      'El peso 50/50 entre precio y uso no es una preferencia, es una equivalencia: el recorrido de la escala de precio son 22.000 €; el de uso, 1.800 €/año. 22.000 € ÷ 1.800 €/año ≈ 12,2 años — teniendo el coche unos doce años, las dos escalas cubren la misma cantidad de dinero, y con recorridos equivalentes 50/50 es la única combinación coherente.',
    ],
  },
};

export const CURVE_EXPLANATION =
  'Entre los dos anclajes, la nota no sube en línea recta: sube poco cerca ' +
  'de los extremos y rápido en el centro. Afinar cerca del anclaje bueno no ' +
  'compra casi nada —ya casi es un 10—, y estar cerca del anclaje malo es ' +
  'casi tan malo como estarlo del todo. Es una curva en S, y la usan seis ' +
  'de los ocho ejes: todos menos estética y prueba real.';

export const WEIGHT_TIE_WARNING =
  'Con estas escalas fijas, subir el peso de un eje no cambia nada si los ' +
  'candidatos que estás mirando sacan la misma nota en él: un peso ' +
  'multiplica una diferencia, y si no hay diferencia, no hay nada que ' +
  'multiplicar. Mover un deslizador y no ver que el orden cambie no es un ' +
  'fallo: es que ese eje ya no distingue a los coches que tienes delante.';

export const ELIMINATORY_EXPLANATION =
  'Un imprescindible —un mínimo o un máximo sobre una magnitud, en el ' +
  'panel «Imprescindibles» de la clasificación— filtra quién se ve, nunca ' +
  'cambia la nota: un coche que incumple uno se puntúa exactamente igual ' +
  'que si no existiera, y solo deja de aparecer en el tramo principal de ' +
  'la clasificación. El presupuesto es uno de ellos, con el mismo ' +
  'mecanismo. Un coche que no declara la magnitud de un imprescindible no ' +
  'cuenta como incumplimiento: sin dato, no hay nada que afirmar.';

export const PROVENANCE_EXPLANATION =
  'Todo dato del catálogo declara su fuente. Cuando dos fuentes no ' +
  'coinciden en un valor, el comparador se queda con la vigente y muestra ' +
  'la otra como descartada, con su propio valor y el motivo por el que no ' +
  'se usa. Un dato marcado como estimado no viene de una fuente publicada ' +
  '—es la mejor cifra disponible— y se distingue del resto con una tilde ' +
  '(~) junto a la cifra, con su explicación accesible al lado.';

export interface KnownLimitation {
  title: string;
  description: string;
}

export const KNOWN_LIMITATIONS: KnownLimitation[] = [
  {
    title: 'La fiabilidad de la OCU es por marca, no por modelo',
    description:
      'Hoy no existe un índice público desglosado por modelo, así que el ' +
      'eje de fiabilidad puntúa la marca entera y lo presenta como si ' +
      'fuera del coche concreto.',
  },
  {
    title: 'La aceleración del Toyota Corolla Cross 140H es una estimación',
    description:
      'El fabricante no publica esa cifra para esta versión: la que se ' +
      'usa es la mejor estimación disponible, marcada como tal en el ' +
      'desglose.',
  },
];
