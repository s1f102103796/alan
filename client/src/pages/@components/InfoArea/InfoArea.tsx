import type { ActiveAppModel } from 'commonTypesWithClient/appModels';
import Link from 'next/link';
import { Spacer } from 'src/components/Spacer';
import { GithubIcon } from 'src/components/icons/GithubIcon';
import { RailwayIcon } from 'src/components/icons/RailwayIcon';
import { SiteIcon } from 'src/components/icons/SIteIcon';
import { VscodeIcon } from 'src/components/icons/VscodeIcon';
import { staticPath } from 'src/utils/$path';
import styles from './infoArea.module.css';

const imgHeight = '(100vh - 48px - 48px)';

export const InfoArea = (props: { app: ActiveAppModel }) => {
  return (
    <div className={styles.container}>
      <div className={styles.appName}>
        No.{props.app.index} - {props.app.name}
      </div>
      {props.app.urls ? (
        <>
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
            <div className={styles.linkContainer}>
              {[
                {
                  icon: <SiteIcon size={24} fill="#fff" />,
                  label: 'Web App',
                  href: props.app.urls.site,
                },
                {
                  icon: <GithubIcon size={24} fill="#fff" />,
                  label: 'GitHub',
                  href: props.app.urls.github,
                },
                {
                  icon: <VscodeIcon size={24} />,
                  label: 'VSCode',
                  href: props.app.urls.vscode,
                },
                {
                  icon: <RailwayIcon size={24} fill="#fff" />,
                  label: 'Railway',
                  href: props.app.railway.url,
                },
              ].map((params) => (
                <div key={params.label}>
                  <Link href={params.href} target="_brank">
                    <div className={styles.linkCard}>
                      <div className={styles.linkIcon}>{params.icon}</div>
                      <div className={styles.linkTexts}>
                        <div className={styles.linkLabel}>{params.label}</div>
                        <Spacer axis="y" size={2} />
                        <div className={styles.linkHref}>{params.href}</div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div>デプロイ中...</div>
      )}
    </div>
  );
};
