import { APP_TITLE } from 'commonConstantsWithClient';
import styles from './BasicHeader.module.css';

export const BasicHeader = () => {
  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.logo}>{APP_TITLE}</div>
        <div className={styles.result}>
          <div>総資産 1,100,000円</div>
          <div>原資 1,000,000円</div>
          <div>損益 +10.0%</div>
        </div>
      </div>
    </div>
  );
};
