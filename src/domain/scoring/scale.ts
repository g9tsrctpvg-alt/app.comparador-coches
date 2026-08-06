/**
 * Curva en S (smoothstep) entre dos anclajes absolutos: nota 10 en el
 * anclaje bueno, nota 0 en el malo, y nunca depende de qué otros candidatos
 * traiga el catálogo (ADR 0004). `goodAnchor` puede ser mayor o menor que
 * `badAnchor` — la magnitud puede mejorar subiendo (batalla) o bajando
 * (anchura) — porque `t` se mide como fracción con signo del recorrido
 * entre ambos anclajes, no como una resta en un sentido fijo.
 */
export function scoreOnAbsoluteScale(
  value: number,
  goodAnchor: number,
  badAnchor: number,
): number {
  const t = Math.min(
    1,
    Math.max(0, (value - goodAnchor) / (badAnchor - goodAnchor)),
  );
  return 10 * (1 - t * t * (3 - 2 * t));
}
