export const WifiIcon = (props: { fill: string }) => {
  const scaleFactor = 1.2;
  const centerX = 10;
  const centerY = 10;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.fill}
      strokeWidth="2"
    >
      <g
        transform={`scale(${scaleFactor}) translate(${-centerX * (scaleFactor - 1)} ${
          -centerY * (scaleFactor - 1)
        })`}
      >
        <path d="M5.53 10C8.35 7 15.64 7 18.46 10" />
        <path d="M8.53 13C10.36 11.09 13.63 11.09 15.46 13" />
        <path d="M10.53 15.55C11.25 14.87 12.77 14.87 13.46 15.55" />
      </g>
    </svg>
  );
};
