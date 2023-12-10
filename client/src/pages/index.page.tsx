import type { AppModel } from 'commonTypesWithClient/appModels';
import type { AppId } from 'commonTypesWithClient/branded';
import { useAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { userAtom } from 'src/atoms/user';
import { Loading } from 'src/components/Loading/Loading';
import { apiClient } from 'src/utils/apiClient';
import { returnNull } from 'src/utils/returnNull';
import { AppList } from './@components/AppList/AppList';
import { BasicHeader } from './@components/BasicHeader/BasicHeader';
import styles from './index.module.css';

const Home = () => {
  const [user] = useAtom(userAtom);
  const [apps, setApps] = useState<AppModel[]>();
  const [selectedAppId, setSelectedAppId] = useState<AppId>();
  const sortedApps = useMemo(
    () => apps?.sort((a, b) => b.createdTime - a.createdTime) ?? [],
    [apps]
  );
  const currentApp = useMemo<AppModel | undefined>(
    () => sortedApps.find((app) => app.id === selectedAppId) ?? sortedApps[0],
    [selectedAppId, sortedApps]
  );
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

  if (!user) return null;
  if (apps === undefined) return <Loading visible />;

  return (
    <>
      <BasicHeader user={user} />
      <div className={styles.main}>
        <div>
          <div className={styles.appList}>
            <AppList
              sortedApps={sortedApps}
              currentApp={currentApp}
              select={(app) => setSelectedAppId(app.id)}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
