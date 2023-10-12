import { type JobModel } from 'commonTypesWithClient/models';
import { useState } from 'react';
import { PrimeButton } from 'src/components/Buttons/Buttons';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'src/components/Modal/Modal';
import { Spacer } from 'src/components/Spacer';
import { Textarea } from 'src/components/Textarea/Textarea';
import { useLoading } from 'src/pages/@hooks/useLoading';
import { formatShortTimestamp } from 'src/utils/dayjs';
import styles from './jobList.module.css';

export const JobList = (props: {
  sortedJobs: JobModel[];
  currentJob: JobModel | undefined;
  select: (job: JobModel) => void;
}) => {
  const { addLoading, removeLoading } = useLoading();
  const [opened, setOpened] = useState(false);
  const [desc, setDesc] = useState('');
  const createJob = async () => {
    addLoading();
    removeLoading();
    setOpened(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.createBtn}>
        <PrimeButton label="ジョブ新規作成" width="100%" onClick={() => setOpened(true)} />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {props.sortedJobs.map((job) => (
          <div
            key={job.id}
            className={styles.jobItem}
            style={{ background: props.currentJob?.id === job.id ? '#fff1' : '' }}
            onClick={() => props.select(job)}
          >
            <div className={styles.title}>{job.title}</div>
            <Spacer axis="y" size={6} />
            <div className={styles.itemBottom}>
              <div
                className={styles.statusCircle}
                style={{
                  background: {
                    ready: '#aaa',
                    running: '#ff0',
                    stopped: '#14b869',
                    archived: '#ec0000',
                  }[job.status],
                }}
              />
              <span className={styles.date}>{formatShortTimestamp(job.createdTimestamp)}</span>
            </div>
          </div>
        ))}
      </div>
      <Modal open={opened}>
        <ModalHeader text="ジョブ新規作成" />
        <ModalBody
          content={
            <>
              <Textarea rows={8} value={desc} onChange={setDesc} />
            </>
          }
        />
        <ModalFooter okText="新規作成" ok={createJob} cancel={() => setOpened(false)} />
      </Modal>
    </div>
  );
};
