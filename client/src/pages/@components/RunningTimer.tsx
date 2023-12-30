import { useEffect, useState } from 'react';
import { diffSec } from 'src/utils/dayjs';

export const RunningTimer = (props: { start: number; end: number | undefined }) => {
  const [end, setEnd] = useState(props.end ?? props.start);
  const duration = diffSec(props.start, end);
  const s = duration % 60;
  const m = ((duration - s) / 60) % 60;
  const h = (duration - m * 60 - s) / 3600;

  useEffect(() => {
    if (props.end !== undefined) {
      setEnd(props.end);
      return;
    }

    const timerId = window.setInterval(() => {
      setEnd(Date.now());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [props.end]);

  return (
    <span>
      {h > 0 ? `${h}h` : ''}
      {m > 0 ? `${m}m` : ''}
      {s}s
    </span>
  );
};
