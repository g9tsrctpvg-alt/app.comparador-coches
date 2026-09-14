import primitives from '../primitives.module.css';

/** Una magnitud que sale de una pieza móvil —hoy, la banqueta trasera
 * deslizante— se distingue con una flecha doble y su explicación accesible
 * al lado, nunca sola (product/0040, requisito 3.2). No es la tilde de
 * estimado ni comparte su color: aquel avisa de que el dato no está
 * verificado, este declara una capacidad del coche, y por eso va en
 * `accent` y no en `signal`. */
export function AdjustableMark() {
  return (
    <span className={primitives.adjustableMark}>
      <span aria-hidden="true">↔</span>
      <span className={primitives.visuallyHidden}>
        {' '}
        (banqueta trasera deslizante: es el espacio máximo, y se reduce si se
        adelanta el banco para ganar maletero)
      </span>
    </span>
  );
}
