export const moveRaspi = (id: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Hello, ${id}`);
    }, 1000);
  });
};
