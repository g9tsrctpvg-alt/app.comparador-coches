export function mustGet<K, V>(map: Map<K, V>, key: K): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Clave no encontrada en el mapa: ${String(key)}`);
  }
  return value;
}
