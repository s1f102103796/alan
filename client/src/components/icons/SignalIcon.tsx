export const SignalIcon = (props: { size: number; fill: string }) => {
  const barWidth = 2;
  const baseHeight = 2;
  const heightIncrement = 2;
  const borderRadius = 1;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill={props.fill}
    >
      <rect
        x="3"
        y={24 - baseHeight}
        width={barWidth}
        height={baseHeight}
        rx={borderRadius}
        ry={borderRadius}
      />
      <rect
        x="7"
        y={24 - (baseHeight + heightIncrement * 1)}
        width={barWidth}
        height={baseHeight + heightIncrement * 1}
        rx={borderRadius}
        ry={borderRadius}
      />
      <rect
        x="11"
        y={24 - (baseHeight + heightIncrement * 2)}
        width={barWidth}
        height={baseHeight + heightIncrement * 2}
        rx={borderRadius}
        ry={borderRadius}
      />
      <rect
        x="15"
        y={24 - (baseHeight + heightIncrement * 3)}
        width={barWidth}
        height={baseHeight + heightIncrement * 3}
        rx={borderRadius}
        ry={borderRadius}
      />
    </svg>
  );
};
