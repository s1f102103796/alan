import type { UserId } from '../commonTypesWithClient/branded';

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
      board[y][x] = board[y][x] % 3;
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
    board[x + w[1] * i] === undefined ||
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

  const getRandomPosition = (positions: number[][]): number[] => {
    const randomIndex = Math.floor(Math.random() * positions.length);
    return positions[randomIndex];
  };
  return getRandomPosition(positions);
};

let randomPositionbefore: number[] = [];
let count = 0;
let turndeluxe = 1;
let turn = 1;

const advanceBoard = (
  advancey: number,
  advancex: number,
  turnclour: number,
  recursive: boolean
) => {
  if (onoff === 1) {
    let pass = 0;
    turn = turnclour;
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
    turn = 3 - turnclour;
    const Pass = () => {
      const candidate = countCandidates();
      if (candidate !== 0) {
        console.log('ゲーム続行');
        pass = 0;
      } else {
        handlePass();
      }
    };
    clearNewBoard();
    changeBoard(advancex, advancey, true, turnclour);
    updateBoard(3 - turnclour);
    Pass();
    const candidate = countCandidates();
    if (recursive && candidate !== 0) {
      const randomPosition = countthree();
      console.log('こっち来ている');
      console.log(randomPosition);
      turndeluxe = turn;
      setTimeout(function () {
        advanceBoard(randomPosition[0], randomPosition[1], turn, true);
      }, 1000);
    }
    return { board, turn };
  }
  return { board, turn };
};

let onoff = 0;

export const boardUseCace = {
  getBoard: () => board,
  clickBoard: (params: { x: number; y: number; turn: number }, userId: UserId) => {
    onoff = 1;
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
    count = 0;
    onoff = 0;
    randomPositionbefore = [];
    return board;
  },

  startBoard: () => {
    onoff = 1;
    randomPositionbefore = countthree();
    advanceBoard(randomPositionbefore[0], randomPositionbefore[1], turndeluxe, true);
  },

  getTurn: () => turndeluxe,
  getChat: () => randomPositionbefore,
};
