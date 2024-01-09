import dayjs from 'dayjs';
import ja from 'dayjs/locale/ja';
import utc from 'dayjs/plugin/utc';

dayjs.locale(ja);
dayjs.extend(utc);

export const toJST = (timestamp: number) => dayjs(timestamp).utc().add(9, 'hour');
