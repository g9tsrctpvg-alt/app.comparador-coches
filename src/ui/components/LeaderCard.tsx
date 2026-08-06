import type { CarScoreBreakdown } from '../../domain/scoring/breakdown';
import { formatNumber } from '../format';
import styles from './LeaderCard.module.css';

interface LeaderCardProps {
  car: CarScoreBreakdown;
}

/** La única superficie invertida de la interfaz (product/0009, requisito 6):
 * nombra al primer clasificado con los pesos vigentes antes de que haya que
 * leer la lista. */
export function LeaderCard({ car }: LeaderCardProps) {
  return (
    <div className={styles.card}>
      <div>
        <span className={styles.label}>Líder con estos pesos</span>
        <span className={styles.name}>{car.carName}</span>
      </div>
      <span className={styles.score}>{formatNumber(car.percentage, 0)}%</span>
    </div>
  );
}
