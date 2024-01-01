export const ClockIcon = (props: { date: Date }) => {
  return (
    <span>
      {props.date.getHours().toString().padStart(2, '0')}:
      {props.date.getMinutes().toString().padStart(2, '0')}
    </span>
  );
};
