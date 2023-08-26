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

// const newBoard: number[][] = JSON.parse(JSON.stringify(resetboard));

export const boardUseCace = {
  getBoard: () => board,
  clickBoard: (params: { x: number; y: number; turn: number }, userId: UserId) => {
    let pass = 0;
    let turn = params.turn;
    const clearNewBoard = () => {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          board[y][x] = board[y][x] % 3; // 3 -> 0にしている
        }
      }
    };
    const flipPiece = (
      x: number,
      y: number,
      type: boolean,
      color: number,
      w: number[],
      i: number
    ) => {
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

    const handlePass = () => {
      console.log('パス');
      pass++;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          changeBoard(x, y, false, params.turn);
        }
      }
      turn = 3 - params.turn;
    };

    const Pass = () => {
      const candidate = countCandidates();
      if (candidate !== 0) {
        console.log('ゲーム続行');
        pass = 0;
        turn = params.turn;
      } else {
        handlePass();
      }
    };
    clearNewBoard();
    changeBoard(params.x, params.y, true, params.turn);
    updateBoard(3 - params.turn);
    Pass();
    // board[params.y][params.x] = params.turn;
    return { board, turn };
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
    return board;
  },
};
