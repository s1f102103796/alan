import type { MessageModel } from '@chatscope/chat-ui-kit-react';
import { Avatar, Message } from '@chatscope/chat-ui-kit-react';
import type { AppModel } from 'commonTypesWithClient/appModels';
import type { GHActionModel, RWDeploymentModel } from 'commonTypesWithClient/bubbleModels';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Spacer } from 'src/components/Spacer';
import { BranchIcon } from 'src/components/icons/BranchIcon';
import { RunningTimer } from '../RunningTimer';
import { StatusIcon } from '../StatusIcon/StatusIcon';
import { NameLabel } from './NameLabel';
import styles from './chatArea.module.css';

export const CustomContent = (props: {
  content: GHActionModel | RWDeploymentModel;
  status: AppModel['status'];
  title: string;
  icon: ReactNode;
}) => {
  return (
    <Message model={{ type: 'custom' } as MessageModel} avatarPosition="tl">
      <Avatar>
        <Spacer axis="y" size={26} />
        <Spacer axis="x" size={4} />
        {props.icon}
      </Avatar>
      <Message.CustomContent>
        <NameLabel
          name={props.content.model === 'github' ? 'GitHub Actions' : 'Railway'}
          createdTime={props.content.createdTime}
        />
        <Spacer axis="y" size={8} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <StatusIcon status={props.status} />
          <Spacer axis="x" size={10} />
          <Link href={props.content.url} target="_brank" style={{ flex: 1 }}>
            <div className={styles.contentTitle}>{props.title}</div>
          </Link>
        </div>
        <Spacer axis="y" size={6} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Spacer axis="x" size={2} />
          <div style={{ height: '20px' }}>
            <Spacer axis="y" size={2} />
            <BranchIcon size={20} fill="#fff" />
          </div>
          <Spacer axis="x" size={8} />
          <Link href={props.content.branchUrl} target="_brank" className={styles.commitLink}>
            {props.content.branch}
          </Link>
          <Spacer axis="x" size={6} />
          <div>-</div>
          <Spacer axis="x" size={6} />
          <Link href={props.content.commitUrl} target="_brank" className={styles.commitLink}>
            {props.content.commitId.slice(0, 7)}
          </Link>
          <Spacer axis="x" size={40} />
          <div style={{ marginLeft: 'auto' }}>
            <RunningTimer
              start={props.content.createdTime}
              end={
                props.status === 'failure' || props.status === 'success'
                  ? props.content.updatedTime
                  : undefined
              }
            />
          </div>
        </div>
      </Message.CustomContent>
    </Message>
  );
};
