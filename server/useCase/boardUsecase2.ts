// import type { UserId } from '$/commonTypesWithClient/branded';
// import { func1 } from './aaa';

// let board: BoardArray = [
//   [0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 3, 0, 0, 0],
//   [0, 0, 0, 1, 2, 3, 0, 0],
//   [0, 0, 3, 2, 1, 0, 0, 0],
//   [0, 0, 0, 3, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0],
// ];
// let onoff = 0;

// let turn = 1;

// const passCount = 0;
// export type BoardArray = number[][];
// export type Position = { x: number; y: number };
// const dir: { y: -1 | 0 | 1; x: -1 | 0 | 1 }[] = [
//   { y: -1, x: 1 },
//   { y: -1, x: 0 },
//   { y: -1, x: -1 },
//   { y: 0, x: -1 },
//   { y: 1, x: -1 },
//   { y: 1, x: 0 },
//   { y: 1, x: 1 },
//   { y: 0, x: 1 },
// ]; //いい感じに0か-1を返す関数
// const num0or_1 = (dir: { arr: number[]; y: number; x: number }) =>
//   Math.ceil(Math.max(dir.y + 0.5 * dir.x, 0) / 2) - 1;
// //ANCHOR - changeBoard
// const changeBoard = (y: number, x: number, turnColor: number, type: 0 | 1, board: BoardArray) => {
//   let changeTurnColor = 3 - turnColor;
//   const dirs1: { arr: number[]; y: number; x: number }[] = dir.map((d) => {
//     const arr1 = board //クリックしたところを起点に長方形にboardを切り取る
//       .map((row) =>
//         row.slice(x + Math.min(0, d.x) * x, x + Math.max(0, d.x) * (board.length - 1 - x) + 1)
//       )
//       .slice(y + Math.min(0, d.y) * y, y + Math.max(0, d.y) * (board.length - 1 - y) + 1);
//     const dxy = d.x * d.y;
//     const length: number =
//       Math.max(arr1.length, arr1[0].length) - Math.abs(arr1.length - arr1[0].length) * dxy ** 2;
//     const arr11 = arr1 //切り取ったboardを正方形にする
//       .map((row) =>
//         row.slice(
//           Math.min(0, Math.min(length, row.length) * d.x),
//           (Math.min(Math.min(length, row.length) * d.x, row.length * d.x) * d.x) ** (d.x ** 2)
//         )
//       );
//     const arr2 = arr11 //切り取ったboardを正方形にする
//       .slice(
//         Math.min(0, Math.min(length, arr1.length) * d.y),
//         (Math.min(Math.min(length, arr1.length) * d.y, arr1.length * d.y) * d.y) ** (d.y ** 2)
//       );
//     const arr21 = arr2
//       .flat()
//       .filter((n, i) => i % Math.max(1, arr2.length ** (dxy ** 2) + dxy) === 0); //見る方向に即した１次元配列にする
//     const a = Math.min(Math.abs(Math.min(0, dxy)), arr21.length - 1); //左下右上方向の処理と1ｘ1の時の処理
//     const arr3 = arr21.slice(a, arr21.length - a); //左下右上方向の時に余計なものが含まれるため取り除く
//     return { arr: arr3, y: d.y, x: d.x };
//   });
//   const dirs2 = dirs1 //クリックしたマスが空白かどうか
//     .filter((dir) => dir.arr[(dir.arr.length + num0or_1(dir)) % dir.arr.length] === 0);
//   const dirs3 = dirs2 //クリックしたマスからturnColorまでの配列に切り出す
//     .map((dir) => {
//       return {
//         arr: dir.arr.slice(
//           Math.max(
//             num0or_1(dir) + 1,
//             Math.min(
//               (dir.arr.lastIndexOf(turnColor) + dir.arr.length) % dir.arr.length, //-1が返ってきたときうまく処理する
//               (dir.arr.length + num0or_1(dir)) % dir.arr.length //方向に応じて最初か最後になる
//             )
//           ),
//           Math.max(
//             num0or_1(dir) + 1,
//             Math.max(
//               dir.arr.indexOf(turnColor) + 1, //-1が返ってきたときはこっちを通らないためOK
//               (dir.arr.length + num0or_1(dir)) % dir.arr.length //方向に応じて最初か最後になる
//             )
//           )
//         ),
//         y: dir.y,
//         x: dir.x,
//       };
//     });
//   const dirs4 = dirs3.map((dir) => {
//     return {
//       arr: dir.arr.slice(-num0or_1(dir), dir.arr.length - (num0or_1(dir) + 1)), //最初と最後は自身の色と空マスなため除外
//       y: dir.y,
//       x: dir.x,
//     };
//   });
//   const dirs5 = dirs4.filter((dir) => dir.arr.every((n) => n === 3 - turnColor)); //配列の中身がすべて3-turnColorか判断
//   dirs5.forEach((dir) => {
//     dir.arr.forEach((d, n) => {
//       board[y + (n + 1) * dir.y * type][x + (n + 1) * dir.x * type] =
//         turnColor * type - 3 * (type - 1);
//       changeTurnColor = turnColor * type - (3 - turnColor) * (type - 1);
//     });
//   });
//   const controlsTurn = Math.abs(Math.abs(turnColor - changeTurnColor) - 1);
//   board[y][x] += turnColor * controlsTurn * type;
//   return changeTurnColor;
// };
// //ANCHOR - changeBoard3
// const changeBoard3 = (board: BoardArray, inTurn: number) => {
//   board.forEach((row, y) => {
//     row.forEach((color, x) => {
//       changeBoard(y, x, inTurn, 0, board);
//     });
//   });
// };
// //ANCHOR - turn

// const pass = (board: number[][]) => Math.min(1, board.flat().filter((n) => n === 3).length); //pass=>0
// const clickBoard = (
//   params: Position,
//   board: BoardArray,
//   inTurn: number,
//   inPassCount: number
// ): { board: BoardArray; turn: number; passCount: number } => {
//   //ANCHOR - clickBoard
//   let turn = inTurn;
//   let passCount = inPassCount;
//   board.forEach((row, y) => row.forEach((color, x) => (board[y][x] = color % 3)));
//   turn = 3 - changeBoard(params.y, params.x, turn, 1, board);

//   //test
//   changeBoard3(board, turn);
//   turn = turn * pass(board) - (3 - turn) * (pass(board) - 1); //pass
//   passCount = -(passCount + 1) * (pass(board) - 1);
//   changeBoard3(board, turn);
//   turn = turn * pass(board) - 3 * (pass(board) - 1); //end
//   return { board, turn, passCount };
// };

// const makeBoard = () => {
//   if (onoff === 1) {
//     console.table(board);
//     const canselId = setInterval(() => {
//       const copyBoard: BoardArray = JSON.parse(JSON.stringify(board));
//       changeBoard3(copyBoard, turn);
//       const threes = copyBoard
//         .map((row, y) => row.map((color, x) => ({ x, y, color })))
//         .flat()
//         .filter((i) => i.color === 3)
//         .map((i) => [i.x, i.y]);
//       const saiki = () => {
//         func1(threes).then((result) => {
//           if (result === undefined) {
//             saiki();
//           } else {
//             turn = clickBoard({ x: result[0], y: result[1] }, board, turn, passCount).turn;
//           }
//         });
//       };
//       return () => clearInterval(canselId);
//     });
//   }
// };
// makeBoard
// export const boardUsecace2 = {
//   getBoard: () => board,

//   clickBoard: (params: { x: number; y: number; turn: number }, userId: UserId) => {
//     return clickBoard({ x: params.x, y: params.y }, board, params.turn, passCount);
//   },
//   resetBoard: () => {
//     board = [
//       [0, 0, 0, 0, 0, 0, 0, 0],
//       [0, 0, 0, 0, 0, 0, 0, 0],
//       [0, 0, 0, 0, 3, 0, 0, 0],
//       [0, 0, 0, 1, 2, 3, 0, 0],
//       [0, 0, 3, 2, 1, 0, 0, 0],
//       [0, 0, 0, 3, 0, 0, 0, 0],
//       [0, 0, 0, 0, 0, 0, 0, 0],
//       [0, 0, 0, 0, 0, 0, 0, 0],
//     ];
//     onoff = 0;
//     return board;
//   },
//   startBoard: async () => {
//     onoff = 1;
//   },

//   stopBoard: () => {
//     onoff = 0;
//     return board;
//   },
// };
