import { useEffect, useState } from 'react';

export const DigitalClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <span>
      {currentTime.getHours().toString().padStart(2, '0')}:
      {currentTime.getMinutes().toString().padStart(2, '0')}
    </span>
  );
};
