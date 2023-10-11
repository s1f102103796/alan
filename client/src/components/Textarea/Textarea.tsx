import styles from './textarea.module.css';

export const Textarea = (props: {
  rows: number;
  width?: string;
  value: string;
  onChange: (text: string) => void;
}) => {
  return (
    <textarea
      className={styles.textarea}
      rows={props.rows}
      style={{ width: props.width ?? '100%' }}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
};
