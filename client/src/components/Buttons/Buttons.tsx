import { CSS_VARS } from 'src/utils/constants';
import styles from './buttons.module.css';

export const PrimeButton = (props: {
  label: string;
  width?: string;
  isDark?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    className={styles.button}
    style={
      props.isDark === true
        ? { background: 'white', color: CSS_VARS.themeFontColor, width: props.width }
        : {
            background: `${CSS_VARS.themeFontColor}33`,
            borderColor: 'white',
            color: 'white',
            width: props.width,
          }
    }
    disabled={props.disabled}
    onClick={props.onClick}
  >
    {props.label}
  </button>
);

export const WarningButton = (props: {
  label: string;
  width?: string;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    className={styles.button}
    style={{
      background: `${CSS_VARS.warning}33`,
      borderColor: CSS_VARS.warning,
      color: 'white',
      width: props.width,
    }}
    disabled={props.disabled}
    onClick={props.onClick}
  >
    {props.label}
  </button>
);
