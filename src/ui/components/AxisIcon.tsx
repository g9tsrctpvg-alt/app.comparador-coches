import type { ReactNode } from 'react';
import type { AxisId } from '../../domain/scoring/weights';
import styles from './AxisIcon.module.css';

/**
 * El dibujo de cada eje, sobre un `viewBox` común de 24×24 (technical/0011,
 * requisito 5.2). Es un mapa de datos y no un `switch` a propósito: seis ramas
 * que solo devuelven marcado son seis ramas que cubrir sin que ninguna decida
 * nada.
 *
 * Ninguno lleva color ni grosor propios. El trazo sale de la hoja de módulo y
 * el color se hereda de `--axis-color`, así que el mismo dibujo sirve para el
 * eje que sea.
 */
const AXIS_SHAPE: Record<AxisId, ReactNode> = {
  /* Maleta: el eje mide cuánto equipaje entra (product/0033: la mitad de
   * `viaje` que sigue siendo un dato de maletero, ahora sola). */
  carga: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </>
  ),

  /* Asiento trasero: el eje mide el sitio de quien va detrás, la otra mitad
   * de `viaje` (product/0033). */
  habitabilidad: (
    <>
      <rect x="5" y="4" width="5" height="7" rx="2" />
      <rect x="14" y="4" width="5" height="7" rx="2" />
      <path d="M4 11v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    </>
  ),

  /* Volante: el eje mide la facilidad de conducirlo todos los días. */
  diario: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M3 12h5.8M15.2 12H21M12 15.2V21" />
    </>
  ),

  /* Cuentarrevoluciones con la aguja arriba a la derecha. */
  prestaciones: (
    <>
      <path d="M4.5 16.5a9 9 0 1 1 15 0" />
      <path d="M12 11.5l4.5-4" />
      <circle cx="12" cy="11.5" r="1.1" />
    </>
  ),

  /* Escudo: el eje mide fiabilidad y garantía. */
  fiabilidad: (
    <path d="M12 3l8 3.5v6c0 4.5-3.6 7.8-8 9-4.4-1.2-8-4.5-8-9v-6z" />
  ),

  /* Gema tallada, con una faceta horizontal. */
  estetica: (
    <>
      <path d="M12 3l9 9-9 9-9-9z" />
      <path d="M3 12h18" />
    </>
  ),

  /* Etiqueta de precio, con su ojal. */
  coste: (
    <>
      <path d="M3 12.7V4.5A1.5 1.5 0 0 1 4.5 3h8.2a1.5 1.5 0 0 1 1.06.44l7.3 7.3a1.5 1.5 0 0 1 0 2.12l-8.2 8.2a1.5 1.5 0 0 1-2.12 0l-7.3-7.3A1.5 1.5 0 0 1 3 12.7z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
};

interface AxisIconProps {
  axisId: AxisId;
}

/**
 * El icono de un eje. Siempre `aria-hidden` (requisito 5.3): el nombre del eje
 * está al lado en texto real en los tres sitios donde se usa, así que
 * anunciarlo aquí solo lo diría dos veces.
 */
export function AxisIcon({ axisId }: AxisIconProps) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      {AXIS_SHAPE[axisId]}
    </svg>
  );
}
