import type { PropsWithChildren } from 'react';
import React from 'react';
import { CSS_VARS } from '../../utils/constants';
import { PrimeButton } from '../Buttons/Buttons';
import { Portal } from '../Portal';
import { Spacer } from '../Spacer';
import styles from './modal.module.css';

export const ModalHeader = (props: { text: string }) => {
  return (
    <div
      className={styles.modalHeader}
      style={{ borderBottom: `1px solid ${CSS_VARS.borderColor}33` }}
    >
      {props.text}
    </div>
  );
};

export const ModalBody = (props: { content: React.ReactNode }) => {
  return <div className={styles.body}>{props.content}</div>;
};

// eslint-disable-next-line complexity
export const ModalFooter = (
  props: { headerText?: string } & (
    | { okText?: undefined }
    | ({ okText: string; disabledOk?: boolean; ok: () => void } & (
        | { disabledOk?: undefined }
        | { disabledOk: boolean; disabledText?: string }
      ))
  ) &
    ({ cancelText?: undefined; cancel?: undefined } | { cancelText?: string; cancel: () => void })
) => {
  return (
    <div className={styles.footer}>
      {props.okText !== undefined &&
        props.disabledOk === true &&
        props.disabledText !== undefined && (
          <>
            <div className={styles.warning} style={{ color: CSS_VARS.warning }}>
              {props.disabledText}
            </div>
            <Spacer axis="y" size={12} />
          </>
        )}
      {props.headerText !== undefined && (
        <>
          <div className={styles.header}>{props.headerText}</div>
          <Spacer axis="y" size={12} />
        </>
      )}
      {props.cancel && (
        <PrimeButton label={props.cancelText ?? 'キャンセル'} onClick={props.cancel} />
      )}
      {props.okText !== undefined && (
        <>
          <Spacer axis="x" size={16} />
          <PrimeButton label={props.okText} disabled={props.disabledOk} onClick={props.ok} />
        </>
      )}
    </div>
  );
};

export const Modal = (props: PropsWithChildren<{ open: boolean; onClose?: () => void }>) => {
  return (
    <Portal>
      {props.open && (
        <div className={styles.container}>
          <div className={styles.background} onClick={props.onClose} />
          <div className={styles.card}>{props.children}</div>
        </div>
      )}
    </Portal>
  );
};
