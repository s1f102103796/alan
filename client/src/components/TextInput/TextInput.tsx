import styles from './textInput.module.css';

export const TextInput = (props: {
  width?: string;
  value: string;
  onChange: (text: string) => void;
}) => {
  return (
    <input
      type="text"
      className={styles.textInput}
      style={{ width: props.width ?? '100%' }}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
};
