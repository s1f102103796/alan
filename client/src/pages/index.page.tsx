import type { AppModel } from 'commonTypesWithClient/appModels';
import type { DisplayId } from 'commonTypesWithClient/branded';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { userAtom } from 'src/atoms/user';
import { Loading } from 'src/components/Loading/Loading';
import { apiClient } from 'src/utils/apiClient';
import { returnNull } from 'src/utils/returnNull';
import { AppList } from './@components/AppList/AppList';
import { BasicHeader } from './@components/BasicHeader/BasicHeader';
import { WaitingContent } from './@components/WaitingContent/WaitingContent';
import styles from './index.module.css';

export type Query = {
  displayId?: DisplayId;
};

const Home = () => {
  const router = useRouter();
  const [user] = useAtom(userAtom);
  const [apps, setApps] = useState<AppModel[]>();
  const sortedApps = useMemo(
    () => apps?.sort((a, b) => b.createdTime - a.createdTime) ?? [],
    [apps]
  );
  const selectedAppId = useMemo(
    () => sortedApps.find((app) => app.displayId === router.query.displayId)?.id,
    [sortedApps, router.query.displayId]
  );
  const currentApp = useMemo<AppModel | undefined>(
    () => sortedApps.find((app) => app.id === selectedAppId),
    [selectedAppId, sortedApps]
  );
  const appendApp = (app: AppModel) => {
    setApps((apps) => [...(apps ?? []), app]);
    router.push(`/?displayId=${app.displayId}`);
  };
  const fetchApps = () =>
    apiClient.public.apps
      .$get()
      .then((res) => setApps((apps) => (JSON.stringify(apps) === JSON.stringify(res) ? apps : res)))
      .catch(returnNull);

  useEffect(() => {
    fetchApps();

    const intervalId = window.setInterval(fetchApps, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (apps !== undefined && apps.length > 0 && currentApp === undefined) {
      router.push(`/?displayId=${apps[0].displayId}`);
    }
  }, [apps, currentApp, router]);

  if (!user) return null;
  if (apps === undefined) return <Loading visible />;

  return (
    <>
      <BasicHeader user={user} />
      <div className={styles.main}>
        <div>
          <div className={styles.appList}>
            <AppList sortedApps={sortedApps} currentApp={currentApp} append={appendApp} />
          </div>
          {currentApp &&
            (currentApp.status === 'waiting' ? <WaitingContent app={currentApp} /> : <div />)}
        </div>
      </div>
    </>
  );
};

export default Home;
