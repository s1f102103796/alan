import dayjs from 'dayjs';
import ja from 'dayjs/locale/ja';

dayjs.locale(ja);

export const formatTimestamp = (time: number) => dayjs(time).format('YYYY/MM/DD HH:mm:ss');

export const formatShortTimestamp = (time: number) => dayjs(time).format('YYYY/MM/DD');

export const getDateBefore = (days: number) => dayjs().subtract(days, 'day').format('MM/DD');

export const diffSec = (start: number, end: number) => dayjs(end).diff(start, 's');
