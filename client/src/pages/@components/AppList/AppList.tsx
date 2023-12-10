import type { AppModel } from 'commonTypesWithClient/appModels';
import Link from 'next/link';
import { useState } from 'react';
import { PrimeButton } from 'src/components/Buttons/Buttons';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'src/components/Modal/Modal';
import { Spacer } from 'src/components/Spacer';
import { Textarea } from 'src/components/Textarea/Textarea';
import { useLoading } from 'src/pages/@hooks/useLoading';
import { pagesPath } from 'src/utils/$path';
import { apiClient } from 'src/utils/apiClient';
import { formatShortTimestamp } from 'src/utils/dayjs';
import styles from './appList.module.css';

export const AppList = (props: {
  sortedApps: AppModel[];
  currentApp: AppModel | undefined;
  append: (app: AppModel) => void;
}) => {
  const { addLoading, removeLoading } = useLoading();
  const [opened, setOpened] = useState(false);
  const [desc, setDesc] = useState('');
  const createApp = async () => {
    addLoading();
    await apiClient.apps.$post({ body: { desc } }).then(props.append);
    removeLoading();
    setDesc('');
    setOpened(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.createBtn}>
        <PrimeButton label="アプリ新規作成" width="100%" onClick={() => setOpened(true)} />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {props.sortedApps.map((app) => (
          <Link key={app.id} href={pagesPath.$url({ query: { displayId: app.displayId } })}>
            <div
              className={styles.appItem}
              style={{ background: props.currentApp?.id === app.id ? '#fff1' : '' }}
            >
              <div className={styles.title}>{app.name}</div>
              <Spacer axis="y" size={6} />
              <div className={styles.itemBottom}>
                <div
                  className={styles.statusCircle}
                  style={{
                    background: {
                      waiting: '#aaa',
                      running: '#ff0',
                      success: '#14b869',
                      failure: '#ec0000',
                      closed: '#ec0000',
                    }[app.status],
                  }}
                />
                <Spacer axis="x" size={2} />
                {app.status === 'waiting' && <span>開始待ち残{app.waitingOrder}</span>}
                <span className={styles.date}>{formatShortTimestamp(app.createdTime)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Modal open={opened}>
        <ModalHeader text="どんなアプリが欲しいですか？" />
        <ModalBody content={<Textarea rows={8} value={desc} width="400px" onChange={setDesc} />} />
        <ModalFooter okText="新規作成" ok={createApp} cancel={() => setOpened(false)} />
      </Modal>
    </div>
  );
};
