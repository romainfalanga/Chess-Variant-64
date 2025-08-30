import { Board, Piece, Position, Player, PieceType, GameState } from '@/types/chess';

export function getPossibleMoves(
  board: Board,
  from: Position,
  removedSquares: Set<string>,
  gameState?: GameState
): Position[] {
  const moves: Position[] = [];
  
  for (let toRow = 0; toRow < 8; toRow++) {
    for (let toCol = 0; toCol < 8; toCol++) {
      if (isValidMove(board, from, [toRow, toCol], removedSquares, gameState)) {
        const moveResult = makeMove(board, from, [toRow, toCol], gameState);
        const piece = board[from[0]][from[1]];
        if (piece && !isInCheck(moveResult.board, piece.color, removedSquares)) {
          moves.push([toRow, toCol]);
        }
      }
    }
  }
  
  return moves;
}

export function initializeBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Pions noirs
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' };
  }
  
  // Pions blancs
  for (let col = 0; col < 8; col++) {
    board[6][col] = { type: 'pawn', color: 'white' };
  }
  
  // Pièces noires (rangée du haut)
  const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: pieceOrder[col], color: 'black' };
  }
  
  // Pièces blanches (rangée du bas)
  for (let col = 0; col < 8; col++) {
    board[7][col] = { type: pieceOrder[col], color: 'white' };
  }
  
  return board;
}

export function isValidMove(
  board: Board,
  from: Position,
  to: Position,
  removedSquares: Set<string>,
  gameState?: GameState
): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  
  // Vérifier les limites
  if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;
  
  // Vérifier si la case de destination est supprimée
  if (removedSquares.has(`${toRow}-${toCol}`)) return false;
  
  const piece = board[fromRow][fromCol];
  if (!piece) return false;
  
  const targetPiece = board[toRow][toCol];
  
  // Ne peut pas capturer ses propres pièces
  if (targetPiece && targetPiece.color === piece.color) return false;
  
  switch (piece.type) {
    case 'pawn':
      return isValidPawnMove(board, from, to, piece.color, removedSquares);
    case 'rook':
      return isValidRookMove(board, from, to, removedSquares);
    case 'knight':
      return isValidKnightMove(from, to);
    case 'bishop':
      return isValidBishopMove(board, from, to, removedSquares);
    case 'queen':
      return isValidQueenMove(board, from, to, removedSquares);
    case 'king':
      return isValidKingMove(from, to, board, gameState, removedSquares);
    default:
      return false;
  }
}

function isValidPawnMove(
  board: Board,
  from: Position,
  to: Position,
  color: Player,
  removedSquares: Set<string>
): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;
  
  // Mouvement vers l'avant
  if (fromCol === toCol) {
    // Un pas vers l'avant
    if (toRow === fromRow + direction && !board[toRow][toCol]) {
      return true;
    }
    // Deux pas depuis la position de départ
    if (fromRow === startRow && toRow === fromRow + 2 * direction && 
        !board[toRow][toCol] && !removedSquares.has(`${toRow}-${toCol}`)) {
      return true;
    }
  }
  
  // Capture en diagonale
  if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
    return board[toRow][toCol] !== null;
  }
  
  return false;
}

function isValidRookMove(
  board: Board,
  from: Position,
  to: Position,
  removedSquares: Set<string>
): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  
  // Mouvement horizontal ou vertical uniquement
  if (fromRow !== toRow && fromCol !== toCol) return false;
  
  return isPathClear(board, from, to, removedSquares);
}

function isValidKnightMove(from: Position, to: Position): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  
  const rowDiff = Math.abs(fromRow - toRow);
  const colDiff = Math.abs(fromCol - toCol);
  
  return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isValidBishopMove(
  board: Board,
  from: Position,
  to: Position,
  removedSquares: Set<string>
): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  
  // Mouvement diagonal uniquement
  if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;
  
  return isPathClear(board, from, to, removedSquares);
}

function isValidQueenMove(
  board: Board,
  from: Position,
  to: Position,
  removedSquares: Set<string>
): boolean {
  return isValidRookMove(board, from, to, removedSquares) || 
         isValidBishopMove(board, from, to, removedSquares);
}

function isValidKingMove(
  from: Position, 
  to: Position, 
  board: Board, 
  gameState?: GameState, 
  removedSquares?: Set<string>
): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  
  const rowDiff = Math.abs(fromRow - toRow);
  const colDiff = Math.abs(fromCol - toCol);
  
  // Mouvement normal du roi (une case)
  if (rowDiff <= 1 && colDiff <= 1) {
    return true;
  }
  
  // Vérifier le roque
  if (rowDiff === 0 && colDiff === 2 && gameState && removedSquares) {
    return isValidCastling(from, to, board, gameState, removedSquares);
  }
  
  return false;
}

function isValidCastling(
  from: Position,
  to: Position,
  board: Board,
  gameState: GameState,
  removedSquares: Set<string>
): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  
  const piece = board[fromRow][fromCol];
  if (!piece || piece.type !== 'king') return false;
  
  const color = piece.color;
  const isKingside = toCol > fromCol;
  
  // Vérifier si le roi est sur sa position initiale
  const expectedRow = color === 'white' ? 7 : 0;
  const expectedCol = 4;
  if (fromRow !== expectedRow || fromCol !== expectedCol) return false;
  
  // Vérifier si le roi a déjà bougé
  if (gameState.kingMoved[color]) return false;
  
  // Vérifier les droits de roque
  if (isKingside && !gameState.castlingRights[`${color}Kingside`]) return false;
  if (!isKingside && !gameState.castlingRights[`${color}Queenside`]) return false;
  
  // Vérifier si la tour est présente et n'a pas bougé
  const rookCol = isKingside ? 7 : 0;
  const rook = board[expectedRow][rookCol];
  if (!rook || rook.type !== 'rook' || rook.color !== color) return false;
  
  const rookMovedKey = `${color}${isKingside ? 'Kingside' : 'Queenside'}` as keyof typeof gameState.rookMoved;
  if (gameState.rookMoved[rookMovedKey]) return false;
  
  // Vérifier que les cases entre le roi et la tour sont libres
  const startCol = Math.min(fromCol, rookCol);
  const endCol = Math.max(fromCol, rookCol);
  
  for (let col = startCol + 1; col < endCol; col++) {
    if (board[expectedRow][col] !== null) return false;
    if (removedSquares.has(`${expectedRow}-${col}`)) return false;
  }
  
  // Vérifier que le roi n'est pas en échec
  if (isInCheck(board, color, removedSquares)) return false;
  
  // Vérifier que le roi ne passe pas par une case attaquée
  const kingPath = isKingside ? [fromCol + 1, fromCol + 2] : [fromCol - 1, fromCol - 2];
  for (const col of kingPath) {
    const testBoard = board.map(row => [...row]);
    testBoard[expectedRow][col] = piece;
    testBoard[fromRow][fromCol] = null;
    
    if (isInCheck(testBoard, color, removedSquares)) return false;
  }
  
  return true;
}

function isPathClear(
  board: Board,
  from: Position,
  to: Position,
  removedSquares: Set<string>
): boolean {
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  
  const rowDirection = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
  const colDirection = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
  
  let currentRow = fromRow + rowDirection;
  let currentCol = fromCol + colDirection;
  
  while (currentRow !== toRow || currentCol !== toCol) {
    // Les cases supprimées ne bloquent pas le chemin, elles sont juste ignorées
    if (board[currentRow][currentCol] !== null) {
      return false;
    }
    currentRow += rowDirection;
    currentCol += colDirection;
  }
  
  return true;
}

export function makeMove(
  board: Board, 
  from: Position, 
  to: Position, 
  gameState?: GameState
): { board: Board; isCastling: boolean; rookMove?: { from: Position; to: Position } } {
  const newBoard = board.map(row => [...row]);
  const [fromRow, fromCol] = from;
  const [toRow, toCol] = to;
  
  const piece = newBoard[fromRow][fromCol];
  let isCastling = false;
  let rookMove;
  
  // Vérifier si c'est un roque
  if (piece && piece.type === 'king' && Math.abs(fromCol - toCol) === 2) {
    isCastling = true;
    const isKingside = toCol > fromCol;
    const rookFromCol = isKingside ? 7 : 0;
    const rookToCol = isKingside ? 5 : 3;
    
    // Déplacer la tour
    newBoard[toRow][rookToCol] = newBoard[fromRow][rookFromCol];
    newBoard[fromRow][rookFromCol] = null;
    
    rookMove = {
      from: [fromRow, rookFromCol] as Position,
      to: [toRow, rookToCol] as Position
    };
  }
  
  // Déplacer la pièce principale
  newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;
  
  return { board: newBoard, isCastling, rookMove };
}

export function updateCastlingRights(gameState: GameState, from: Position, to: Position): GameState {
  const [fromRow, fromCol] = from;
  const piece = gameState.board[fromRow][fromCol];
  
  const newGameState = { ...gameState };
  
  // Si le roi bouge, perdre tous les droits de roque pour cette couleur
  if (piece && piece.type === 'king') {
    newGameState.kingMoved = { ...newGameState.kingMoved };
    newGameState.kingMoved[piece.color] = true;
    newGameState.castlingRights = { ...newGameState.castlingRights };
    newGameState.castlingRights[`${piece.color}Kingside`] = false;
    newGameState.castlingRights[`${piece.color}Queenside`] = false;
  }
  
  // Si une tour bouge, perdre le droit de roque correspondant
  if (piece && piece.type === 'rook') {
    const color = piece.color;
    const expectedRow = color === 'white' ? 7 : 0;
    
    if (fromRow === expectedRow) {
      newGameState.rookMoved = { ...newGameState.rookMoved };
      newGameState.castlingRights = { ...newGameState.castlingRights };
      
      if (fromCol === 0) { // Tour dame
        newGameState.rookMoved[`${color}Queenside`] = true;
        newGameState.castlingRights[`${color}Queenside`] = false;
      } else if (fromCol === 7) { // Tour roi
        newGameState.rookMoved[`${color}Kingside`] = true;
        newGameState.castlingRights[`${color}Kingside`] = false;
      }
    }
  }
  
  // Si une tour est capturée, perdre le droit de roque correspondant
  const [toRow, toCol] = to;
  const capturedPiece = gameState.board[toRow][toCol];
  if (capturedPiece && capturedPiece.type === 'rook') {
    const color = capturedPiece.color;
    const expectedRow = color === 'white' ? 7 : 0;
    
    if (toRow === expectedRow) {
      newGameState.rookMoved = { ...newGameState.rookMoved };
      newGameState.castlingRights = { ...newGameState.castlingRights };
      
      if (toCol === 0) {
        newGameState.rookMoved[`${color}Queenside`] = true;
        newGameState.castlingRights[`${color}Queenside`] = false;
      } else if (toCol === 7) {
        newGameState.rookMoved[`${color}Kingside`] = true;
        newGameState.castlingRights[`${color}Kingside`] = false;
      }
    }
  }
  
  return newGameState;
}

export function findKing(board: Board, color: Player): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return [row, col];
      }
    }
  }
  return null;
}

export function isInCheck(board: Board, color: Player, removedSquares: Set<string>): boolean {
  const kingPosition = findKing(board, color);
  if (!kingPosition) return false;
  
  const opponentColor = color === 'white' ? 'black' : 'white';
  
  // Vérifier si une pièce adverse peut attaquer le roi
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === opponentColor) {
        if (isValidMove(board, [row, col], kingPosition, removedSquares)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

export function getAllValidMoves(board: Board, color: Player, removedSquares: Set<string>, gameState?: GameState): Position[][] {
  const validMoves: Position[][] = [];
  
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && piece.color === color) {
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(board, [fromRow, fromCol], [toRow, toCol], removedSquares, gameState)) {
              const moveResult = makeMove(board, [fromRow, fromCol], [toRow, toCol], gameState);
              if (!isInCheck(moveResult.board, color, removedSquares)) {
                validMoves.push([[fromRow, fromCol], [toRow, toCol]]);
              }
            }
          }
        }
      }
    }
  }
  
  return validMoves;
}

export function isCheckmate(board: Board, color: Player, removedSquares: Set<string>, gameState?: GameState): boolean {
  if (!isInCheck(board, color, removedSquares)) return false;
  
  // Vérifier s'il existe des mouvements valides
  const validMoves = getAllValidMoves(board, color, removedSquares, gameState);
  return validMoves.length === 0;
}