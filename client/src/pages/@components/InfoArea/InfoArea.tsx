import type { ActiveAppModel } from 'commonTypesWithClient/appModels';
import Link from 'next/link';
import { staticPath } from 'src/utils/$path';
import styles from './infoArea.module.css';

const imgHeight = '(100vh - 48px - 48px - 20px)';

export const InfoArea = (props: { app: ActiveAppModel }) => {
  return (
    <div className={styles.container}>
      <div className={styles.appName}>{props.app.name}</div>
      <div className={styles.leftContent}>
        <img src={staticPath.images.iphone_png} style={{ height: `calc${imgHeight}` }} />
        <iframe
          src={props.app.urls.site}
          className={styles.iframe}
          allow="fullscreen"
          style={{ borderRadius: `calc(${imgHeight} * 0.055)` }}
        />
        <div className={styles.notch}>
          <img src={staticPath.images.iphone_png} style={{ width: '100%' }} />
        </div>
      </div>
      <div className={styles.rightContent}>
        <div>
          Site:{' '}
          <Link href={props.app.urls.site} target="_brank">
            {props.app.urls.site}
          </Link>
        </div>
        <div>
          GitHub:{' '}
          <Link href={props.app.urls.github} target="_brank">
            {props.app.urls.github}
          </Link>
        </div>
        <div>
          VSCode:{' '}
          <Link href={props.app.urls.vscode} target="_brank">
            {props.app.urls.vscode}
          </Link>
        </div>
        <div>
          Railway:{' '}
          <Link href={props.app.railway.url} target="_brank">
            {props.app.railway.url}
          </Link>
        </div>
      </div>
    </div>
  );
};
