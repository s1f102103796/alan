import type { AppModel } from '$/commonTypesWithClient/appModels';
import Link from 'next/link';
import { useRef } from 'react';
import { BatteryIcon } from 'src/components/Notch/BatteryIcon';
import { SignalIcon } from 'src/components/Notch/SignalIcon';
import { WifiIcon } from 'src/components/Notch/WifiIcon';
import { Spacer } from 'src/components/Spacer';
import { Textarea } from 'src/components/Textarea/Textarea';
import { GithubIcon } from 'src/components/icons/GithubIcon';
import { LockIcon } from 'src/components/icons/LockIcon';
import { RailwayIcon } from 'src/components/icons/RailwayIcon';
import { ReloadIcon } from 'src/components/icons/ReloadIcon';
import { SiteIcon } from 'src/components/icons/SIteIcon';
import { VscodeIcon } from 'src/components/icons/VscodeIcon';
import { staticPath } from 'src/utils/$path';
import { DigitalClock } from '../DigitalClock';
import styles from './infoArea.module.css';

const imgHeight = '(100vh - 48px - 48px)';

export const InfoArea = (props: { app: AppModel }) => {
  const iframe = useRef<HTMLIFrameElement>(null);
  const reload = () => {
    if (iframe.current) iframe.current.src = props.app.urls?.site ?? '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.appName}>
        <span>{props.app.name}</span>
      </div>
      {props.app.urls !== undefined ? (
        <>
          <div className={styles.leftContent}>
            <img src={staticPath.images.iphone_png} style={{ height: `calc${imgHeight}` }} />
            <iframe
              ref={iframe}
              src={props.app.urls.site}
              className={styles.iframe}
              allow="fullscreen"
              style={{ borderRadius: `0 0 calc(${imgHeight} * 0.055) calc(${imgHeight} * 0.055)` }}
            />
            <div className={styles.header}>
              <div className={styles.addressBar}>
                <LockIcon size={10} fill="#222" />
                <Spacer axis="x" size={4} />
                <span>{new URL(props.app.urls.site).host}</span>
                <div className={styles.reload} onClick={reload}>
                  <ReloadIcon fill="#222" size={20} />
                </div>
              </div>
            </div>
            <div className={styles.notch}>
              <img src={staticPath.images.iphone_png} style={{ width: '100%' }} />
            </div>
            <div className={styles.notchContent}>
              <div className={styles.notchGroup}>
                <DigitalClock />
              </div>
              <div className={styles.notchGroup}>
                <SignalIcon fill="#BDBDBD" />
                <WifiIcon fill="#222" />
                <BatteryIcon fill="#222" />
              </div>
            </div>
          </div>
          <div className={styles.rightContent}>
            <Spacer axis="y" size={10} />
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Dev Tools</div>
            <Spacer axis="y" size={8} />
            <div className={styles.linkContainer}>
              {[
                {
                  icon: <GithubIcon size={20} fill="#fff" />,
                  label: 'GitHub',
                  href: props.app.urls.github,
                },
                {
                  icon: <SiteIcon size={20} fill="#fff" />,
                  label: 'Web App',
                  href: props.app.urls.site,
                },
                {
                  icon: <VscodeIcon size={20} />,
                  label: 'VSCode',
                  href: props.app.urls.vscode,
                },
                {
                  icon: <RailwayIcon size={20} fill="#fff" />,
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
            <Spacer axis="y" size={24} />
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>OGP Image</div>
            <Spacer axis="y" size={8} />
            <Textarea rows={5} value={props.app.ogpImage.prompt} onChange={() => null} />
            <Spacer axis="y" size={16} />
            <img src={props.app.ogpImage.url} style={{ width: '100%' }} />
            <Spacer axis="y" size={24} />
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Task List</div>
            <Spacer axis="y" size={8} />
            <div className={styles.taskList}>
              {props.app.taskList.map((task, i) => (
                <div key={task.id} className={styles.task}>
                  <div className={styles.taskTitle}>
                    {i + 1}. {task.title}
                  </div>
                  <div className={styles.taskContent}>{task.content}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div>インフラ構築待機中...</div>
      )}
    </div>
  );
};
