import type { AppModel, UserModel } from 'commonTypesWithClient/appModels';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PrimeButton } from 'src/components/Buttons/Buttons';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'src/components/Modal/Modal';
import { Spacer } from 'src/components/Spacer';
import { Textarea } from 'src/components/Textarea/Textarea';
import { SearchIcon } from 'src/components/icons/SearchIcon';
import { useAppStatus } from 'src/pages/@hooks/useAppStatus';
import { useLoading } from 'src/pages/@hooks/useLoading';
import { pagesPath } from 'src/utils/$path';
import { apiClient } from 'src/utils/apiClient';
import { FIRST_QUESTION } from 'src/utils/constants';
import styles from './appList.module.css';

const StatusCircle = (props: { app: AppModel }) => {
  const appStatus = useAppStatus(props.app);

  return (
    <div
      className={styles.statusCircle}
      style={{
        background: {
          waiting: '#aaa',
          init: '#ff0',
          running: '#ff0',
          success: '#14b869',
          failure: '#ec0000',
          closed: '#ec0000',
        }[appStatus],
      }}
    />
  );
};

export const AppList = (props: {
  user: UserModel | null;
  sortedApps: AppModel[];
  currentApp: AppModel | undefined;
  append: (app: AppModel) => void;
}) => {
  const { addLoading, removeLoading } = useLoading();
  const [opened, setOpened] = useState(false);
  const [desc, setDesc] = useState('');
  const [searchWord, setSearchWord] = useState('');
  const filteredApps = useMemo(
    () =>
      props.sortedApps.filter((app) =>
        searchWord === ''
          ? props.sortedApps
          : searchWord
              .replace(/\u3000/g, ' ')
              .split(' ')
              .every((word) =>
                [app.displayId, `No.${app.index}`, app.author.name, app.name]
                  .join(' ')
                  .includes(word)
              )
      ),
    [searchWord, props.sortedApps]
  );

  const createApp = async () => {
    addLoading();
    await apiClient.apps.$post({ body: { desc } }).then(props.append);
    removeLoading();
    setDesc('');
    setOpened(false);
  };

  return (
    <div className={styles.container}>
      {props.user && (
        <div className={styles.createBtn}>
          <PrimeButton label="アプリ新規生成" width="100%" onClick={() => setOpened(true)} />
        </div>
      )}
      <div className={styles.searchBox}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="スペースで絞り込み"
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
        />
        <div className={styles.searchIcon}>
          <SearchIcon size={18} fill="#fff" />
        </div>
      </div>
      <div className={styles.itemContainer}>
        {filteredApps.map((app) => (
          <Link key={app.id} href={pagesPath.$url({ query: { id: app.displayId } })} shallow>
            <div
              className={styles.appItem}
              style={
                props.currentApp?.id === app.id
                  ? { background: '#fff2', borderColor: '#fff' }
                  : undefined
              }
            >
              <div className={styles.itemHeader}>
                <StatusCircle app={app} />
                <div />
                <span>No.{app.index}</span>
                <Spacer axis="x" size={6} />
                <span className={styles.author}>{app.author.name}</span>
              </div>
              <Spacer axis="y" size={6} />
              <div className={styles.title}>{app.name}</div>
            </div>
          </Link>
        ))}
      </div>
      <Modal open={opened}>
        <ModalHeader text={FIRST_QUESTION} />
        <ModalBody content={<Textarea rows={8} value={desc} width="400px" onChange={setDesc} />} />
        <ModalFooter okText="新規生成" ok={createApp} cancel={() => setOpened(false)} />
      </Modal>
    </div>
  );
};
