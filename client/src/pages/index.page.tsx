import type { AppModel } from 'commonTypesWithClient/appModels';
import type { DisplayId } from 'commonTypesWithClient/branded';
import { useAtom } from 'jotai';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo } from 'react';
import { appsAtom } from 'src/atoms/apps';
import { userAtom } from 'src/atoms/user';
import { apiClient } from 'src/utils/apiClient';
import { returnNull } from 'src/utils/returnNull';
import { AppList } from './@components/AppList/AppList';
import { BasicHeader } from './@components/BasicHeader/BasicHeader';
import { ChatArea } from './@components/ChatArea/ChatArea';
import { InfoArea } from './@components/InfoArea/InfoArea';
import styles from './index.module.css';

export type OptionalQuery = {
  id: DisplayId;
};

const Home = () => {
  const router = useRouter();
  const [user] = useAtom(userAtom);
  const [apps, setApps] = useAtom(appsAtom);
  const sortedApps = useMemo(() => apps.sort((a, b) => b.createdTime - a.createdTime), [apps]);
  const selectedAppId = useMemo(
    () => sortedApps.find((app) => app.displayId === router.query.id)?.id,
    [sortedApps, router.query.id]
  );
  const currentApp = useMemo<AppModel | undefined>(
    () => sortedApps.find((app) => app.id === selectedAppId),
    [selectedAppId, sortedApps]
  );
  const appendApp = (app: AppModel) => {
    setApps((apps) => [...apps, app]);
    router.push(`/?id=${app.displayId}`, undefined, { shallow: true });
  };
  const fetchApps = useCallback(
    () =>
      apiClient.public.apps
        .$get()
        .then((res) =>
          setApps((apps) => (JSON.stringify(apps) === JSON.stringify(res) ? apps : res))
        )
        .catch(returnNull),
    [setApps]
  );

  useEffect(() => {
    fetchApps();

    const intervalId = window.setInterval(fetchApps, 5_000);

    return () => clearInterval(intervalId);
  }, [fetchApps]);

  useEffect(() => {
    if (apps.length > 0 && currentApp === undefined) {
      router.push(`/?id=${apps[0]?.displayId}`, undefined, { shallow: true });
    }
  }, [apps, currentApp, router]);

  return (
    <>
      <BasicHeader user={user} />
      <div className={styles.main}>
        <div>
          <div className={styles.appList}>
            <AppList
              user={user}
              sortedApps={sortedApps}
              currentApp={currentApp}
              append={appendApp}
            />
          </div>
          {currentApp && (
            <>
              <div className={styles.chatArea}>
                <ChatArea app={currentApp} />
              </div>
              <div className={styles.infoArea}>
                <InfoArea app={currentApp} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
