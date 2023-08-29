import type { UserId } from '$/commonTypesWithClient/branded';

export const moveRaspi = (id: UserId | undefined) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Hello, ${id}`);
    }, 1000);
  });
};
