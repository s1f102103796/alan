import { useEffect, useState } from 'react';

export const ClockIcon = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timerId = setTimeout(() => {
      setCurrentTime(new Date());
      const intervalId = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000);

      return () => clearInterval(intervalId);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timerId);
    };
  }, []);

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  return <span>{formatTime(currentTime)}</span>;
};
