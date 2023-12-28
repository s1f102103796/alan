export const WifiIcon = (props: { size: number; fill: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.fill}
      strokeWidth="2"
    >
      <path d="M5.53 15.47C8.35 12.64 15.64 12.64 18.46 15.47" />
      <path d="M8.53 18.46C10.36 16.64 13.63 16.64 15.46 18.46" />
      <path d="M11 21.1a1.5 1.6 0 0 1 2 0" />
    </svg>
  );
};
