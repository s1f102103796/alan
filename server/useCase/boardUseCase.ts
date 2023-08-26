import type { UserId } from '../commonTypesWithClient/branded';
import { func1 } from './aaa';
export type BoardArr = number[][];

let board: BoardArr = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 0, 0, 0],
  [0, 0, 0, 1, 2, 3, 0, 0],
  [0, 0, 3, 2, 1, 0, 0, 0],
  [0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const directions: number[][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
];

const clearNewBoard = () => {
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      board[y][x] = board[y][x] % 3; // 3 -> 0にしている
    }
  }
};
const flipPiece = (x: number, y: number, type: boolean, color: number, w: number[], i: number) => {
  if (type) {
    board[y][x] = color;
    for (let z = 1; z < i; z++) {
      board[y + w[0] * z][x + w[1] * z] = color;
    }
  } else {
    if (board[y][x] === 0) {
      board[y][x] = 3;
    }
  }
};
const isContinue = (i: number, x: number, y: number, color: number, w: number[]): boolean => {
  return board[y + w[0] * i] !== undefined && board[y + w[0] * i][x + w[1] * i] === 3 - color;
};

const isBreak = (i: number, x: number, y: number, w: number[]): boolean => {
  return (
    board[y + w[0] * i] === undefined ||
    board[y + w[0] * i][x + w[1] * i] === undefined ||
    board[y + w[0] * i][x + w[1] * i] % 3 === 0
  );
};

const flipPiece2 = (x: number, y: number, type: boolean, color: number, w: number[]) => {
  for (let i = 2; i < 9; i++) {
    if (isContinue(i, x, y, color, w)) {
      continue;
    } else if (isBreak(i, x, y, w)) {
      break;
    } else {
      flipPiece(x, y, type, color, w, i);
    }
  }
};

const changeBoard = (x: number, y: number, type: boolean, color: number) => {
  if (board[y][x] === 0) {
    for (const w of directions) {
      if (board[y + w[0]] !== undefined && board[y + w[0]][x + w[1]] === 3 - color) {
        // 隣が相手の色だったら
        flipPiece2(x, y, type, color, w);
      }
    }
  }
};
const updateBoard = (color: number) => {
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      changeBoard(x, y, false, color);
    }
  }
};

const countCandidates = () => {
  let candidate = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] === 3) {
        candidate++;
      }
    }
  }
  return candidate;
};

const countthree = () => {
  const positions: number[][] = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      if (board[y][x] === 3) {
        positions.push([y, x]);
      }
    }
  }
  console.log(`candidate position is ${positions}`);

  let getRandomPosition = await func1(positions);

  console.log(`chose one position ${getRandomPosition}`);
  if (getRandomPosition === undefined) {
    const newPosition = await func1(positions);
    if (newPosition !== undefined) {
      console.log('return getRandomPos is type of num[]?', getRandomPosition);
      getRandomPosition = newPosition;
      return getRandomPosition;
    }
  } else {
    return getRandomPosition;
  }
};

const turn = 1;
let randomPosition: number[] = [];

const advanceBoard = (
  advancey: number,
  advancex: number,
  turnclour: number,
  recursive: boolean
) => {
  if (onoff === 1) {
    let pass = 0;
    let turn = turnclour;
    const handlePass = () => {
      console.log('パス');
      pass++;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          changeBoard(x, y, false, turnclour);
        }
      }
      turn = 3 - turnclour;
    };

    const Pass = () => {
      const candidate = countCandidates();
      if (candidate !== 0) {
        pass = 0;
        turn = turnclour;
      } else {
        handlePass();
      }
    };
    turn = 3 - turnclour;
    clearNewBoard();
    changeBoard(advancex, advancey, true, turnclour);
    console.log(`change board is ?`);
    console.table(board);
    updateBoard(3 - turnclour);
    console.log(`update board is ?`);
    console.table(board);
    Pass();
    const candidate = countCandidates();
    if (recursive && candidate !== 0) {
      const aaa = await countthree();

      if (aaa !== undefined) {
        const randomPosition = aaa;
        console.log(`randomposition${randomPosition}`);

        advanceBoard(randomPosition[0], randomPosition[1], turn, true);
      }
    }
    console.log('return1');
    return { board, turn };
  }
  console.log('return2');
  return { board, turn };
};

let onoff = 0;

export const boardUseCace = {
  getBoard: () => board,
  clickBoard: (params: { x: number; y: number; turn: number }, userId: UserId) => {
    onoff = 1;
    // console.log(func1());

    return advanceBoard(params.y, params.x, params.turn, false);
  },

  resetBoard: () => {
    board = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 3, 0, 0, 0],
      [0, 0, 0, 1, 2, 3, 0, 0],
      [0, 0, 3, 2, 1, 0, 0, 0],
      [0, 0, 0, 3, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ];
    onoff = 0;
    randomPosition = [];
    return board;
  },

  startBoard: () => {
    onoff = 1;
    console.log('countthree return val after two times', countthree());
    const aaa = await countthree();
    console.log('count three return :', aaa);
    async function ProcessResult() {
      const result = aaa;
      if (result !== undefined) {
        randomPosition = result;
        console.log('AI tapping  position', randomPosition);
        advanceBoard(randomPosition[0], randomPosition[1], turn, true);
      }
    }

    ProcessResult();
  },
};
