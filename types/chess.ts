export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type Player = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: Player;
}

export type Position = [number, number];
export type Board = (Piece | null)[][];

export interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  selectedSquare: Position | null;
  removedSquares: Set<string>;
  gameOver: boolean;
  winner: Player | null;
  castlingRights: CastlingRights;
  kingMoved: {
    white: boolean;
    black: boolean;
  };
  rookMoved: {
    whiteKingside: boolean;
    whiteQueenside: boolean;
    blackKingside: boolean;
    blackQueenside: boolean;
  };
}