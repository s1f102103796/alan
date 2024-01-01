export const WifiIcon = (props: { fill: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 28 28"
      fill="none"
      stroke={props.fill}
      strokeWidth="2.5"
    >
      <path d="M5 12.5C10 7 17 7 23 12.5" />
      <path d="M8 15.75C11 12 17 12 20 15.75" />
      <path d="M11.15 18.5C12 17 16 17 16.85 18.5" />
      <polygon points="14,20 13,19 15,19" />
    </svg>
  );
};
