export const LockIcon = (props: { size: number; fill: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      fill={props.fill}
      viewBox="0 0 512 512"
    >
      <g>
        <path
          d="M407.813,212.719h-9.5v-70.406c0.016-39.203-15.984-74.969-41.688-100.625C330.969,15.969,295.203-0.016,256,0
        c-39.203-0.016-74.969,15.969-100.625,41.688c-25.703,25.656-41.703,61.422-41.672,100.625v70.406h-9.516
        c-34.453,0-62.375,27.938-62.375,62.375v174.531c0,34.438,27.922,62.375,62.375,62.375h303.625
        c34.453,0,62.375-27.938,62.375-62.375V275.094C470.188,240.656,442.266,212.719,407.813,212.719z M175.313,142.313
        c0.016-22.391,8.984-42.375,23.625-57.063C213.641,70.594,233.625,61.625,256,61.625s42.359,8.969,57.047,23.625
        c14.656,14.688,23.625,34.672,23.641,57.063v70.406H175.313V142.313z"
        />
      </g>
    </svg>
  );
};