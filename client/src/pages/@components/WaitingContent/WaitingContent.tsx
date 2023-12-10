import type { WaitingAppModel } from 'commonTypesWithClient/appModels';
import styles from './waitingContent.module.css';

export const WaitingContent = (props: { app: WaitingAppModel }) => {
  return (
    <div className={styles.container}>
      <div>API制限のため順番に生成しています。</div>
      <div>開始待ち数は残り{props.app.waitingOrder}です。</div>
    </div>
  );
};
