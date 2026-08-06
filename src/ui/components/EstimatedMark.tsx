import primitives from '../primitives.module.css';

/** Un dato estimado se distingue con la tilde del artefacto, con su
 * explicación accesible al lado — nunca sola (product/0009, requisito 13).
 * Compartido entre la fila del ranking y el desglose de un eje: es la misma
 * marca en los dos sitios donde aparece un dato estimado. */
export function EstimatedMark() {
  return (
    <span className={primitives.estimatedMark}>
      <span aria-hidden="true">~</span>
      <span className={primitives.visuallyHidden}>
        {' '}
        (valor estimado, no verificado directamente)
      </span>
    </span>
  );
}
