import { Spacer } from 'src/components/Spacer';
import { formatTimestamp } from 'src/utils/dayjs';
import styles from './chatArea.module.css';

export const NameLabel = (props: { name: string; createdTime: number }) => {
  return (
    <>
      <span className={styles.nameLabel}>{props.name}</span>
      <Spacer axis="x" size={8} />
      <span className={styles.sentTime}>{formatTimestamp(props.createdTime)}</span>
    </>
  );
};
