export const TimeDisplayHHMM = (props: { date: Date }) => {
  return `${props.date.getHours().toString().padStart(2, '0')}:${props.date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};
