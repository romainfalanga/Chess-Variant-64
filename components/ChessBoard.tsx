import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import ChessSquare from './ChessSquare';
import { Board, Position, Player } from '@/types/chess';

interface ChessBoardProps {
  board: Board;
  selectedSquare: Position | null;
  removedSquares: Set<string>;
  possibleMoves: Position[];
  onSquarePress: (row: number, col: number) => void;
  currentPlayer: Player;
}

const { width: screenWidth } = Dimensions.get('window');
const boardSize = Math.min(screenWidth - 80, 360);
const squareSize = boardSize / 8;

export default function ChessBoard({
  board,
  selectedSquare,
  removedSquares,
  possibleMoves,
  onSquarePress,
  currentPlayer,
}: ChessBoardProps) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <View style={styles.container}>
      {/* Rank labels (left side) */}
      <View style={styles.rankLabels}>
        {ranks.map((rank, index) => (
          <View key={rank} style={[styles.rankLabel, { height: squareSize }]}>
            <Text style={styles.labelText}>{rank}</Text>
          </View>
        ))}
      </View>

      {/* Main board */}
      <View style={styles.boardWrapper}>
        <View style={[styles.board, { width: boardSize, height: boardSize }]}>
          {board.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((piece, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isSelected = selectedSquare && 
                  selectedSquare[0] === rowIndex && 
                  selectedSquare[1] === colIndex;
                const isRemoved = removedSquares.has(`${rowIndex}-${colIndex}`);
                const isPossibleMove = possibleMoves.some(
                  ([moveRow, moveCol]) => moveRow === rowIndex && moveCol === colIndex
                );
                
                return (
                  <ChessSquare
                    key={`${rowIndex}-${colIndex}`}
                    piece={piece}
                    isLight={isLight}
                    isSelected={isSelected}
                    isRemoved={isRemoved}
                    isPossibleMove={isPossibleMove}
                    onPress={() => onSquarePress(rowIndex, colIndex)}
                    canSelect={piece?.color === currentPlayer}
                    size={squareSize}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* File labels (bottom) */}
        <View style={styles.fileLabels}>
          {files.map((file) => (
            <View key={file} style={[styles.fileLabel, { width: squareSize }]}>
              <Text style={styles.labelText}>{file}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rankLabels: {
    marginRight: 8,
    justifyContent: 'flex-start',
  },
  rankLabel: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
  },
  boardWrapper: {
    alignItems: 'center',
  },
  board: {
    flexDirection: 'column',
    borderWidth: 2,
    borderColor: '#8b4513',
  },
  row: {
    flexDirection: 'row',
  },
  fileLabels: {
    flexDirection: 'row',
    marginTop: 8,
  },
  fileLabel: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});