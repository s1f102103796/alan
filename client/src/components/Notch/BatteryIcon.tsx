export const BatteryIcon = (props: { fill: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 13"
      fill="none"
      stroke={props.fill}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="0.5" y="0" width="22" height="12" rx="3" ry="3" stroke={props.fill} />
      <rect x="2.5" y="2.5" width="18" height="7" rx="1" ry="1" fill={props.fill} />
      <rect x="23" y="4.5" width="1" height="3" fill={props.fill} />
    </svg>
  );
};
