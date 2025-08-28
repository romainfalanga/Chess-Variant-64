import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import ChessBoard from '@/components/ChessBoard';
import { GameState, Position } from '@/types/chess';
import { initializeBoard, isValidMove, makeMove, isInCheck, isCheckmate, updateCastlingRights } from '@/utils/chessLogic';

const { width: screenWidth } = Dimensions.get('window');

export default function ChessGame() {
  const [gameState, setGameState] = useState<GameState>({
    board: initializeBoard(),
    currentPlayer: 'white',
    selectedSquare: null,
    removedSquares: new Set(),
    gameOver: false,
    winner: null,
    castlingRights: {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    },
    kingMoved: {
      white: false,
      black: false,
    },
    rookMoved: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false,
    },
  });

  const [actionMode, setActionMode] = useState<'move' | 'remove'>('move');

  const handleSquarePress = useCallback((row: number, col: number) => {
    if (gameState.gameOver) return;

    const position: Position = [row, col];
    const positionKey = `${row}-${col}`;

    if (actionMode === 'remove') {
      if (gameState.removedSquares.has(positionKey)) {
        Alert.alert('Erreur', 'Cette case est déjà supprimée');
        return;
      }

      const piece = gameState.board[row][col];
      if (piece) {
        Alert.alert('Erreur', 'Impossible de supprimer une case occupée par une pièce');
        return;
      }

      const newRemovedSquares = new Set(gameState.removedSquares);
      newRemovedSquares.add(positionKey);

      setGameState(prev => ({
        ...prev,
        removedSquares: newRemovedSquares,
        currentPlayer: prev.currentPlayer === 'white' ? 'black' : 'white',
      }));

      setActionMode('move');
      return;
    }

    if (gameState.selectedSquare) {
      const [selectedRow, selectedCol] = gameState.selectedSquare;
      
      if (selectedRow === row && selectedCol === col) {
        setGameState(prev => ({ ...prev, selectedSquare: null }));
        return;
      }

      if (isValidMove(gameState.board, gameState.selectedSquare, position, gameState.removedSquares, gameState)) {
        const moveResult = makeMove(gameState.board, gameState.selectedSquare, position, gameState);
        const newBoard = moveResult.board;
        const nextPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';

        if (isInCheck(newBoard, gameState.currentPlayer, gameState.removedSquares)) {
          Alert.alert('Mouvement invalide', 'Ce mouvement laisserait votre roi en échec');
          return;
        }

        // Mettre à jour les droits de roque
        const updatedGameState = updateCastlingRights(gameState, gameState.selectedSquare, position);

        let winner = null;
        let gameOver = false;
        if (isCheckmate(newBoard, nextPlayer, gameState.removedSquares, updatedGameState)) {
          winner = gameState.currentPlayer;
          gameOver = true;
          
          if (moveResult.isCastling) {
            Alert.alert('Roque réussi !', `${winner === 'white' ? 'Les Blancs' : 'Les Noirs'} ont roqué et gagné !`);
          } else {
            Alert.alert('Échec et mat !', `Le joueur ${winner === 'white' ? 'Blanc' : 'Noir'} gagne !`);
          }
        } else if (moveResult.isCastling) {
          Alert.alert('Roque réussi !', `${gameState.currentPlayer === 'white' ? 'Les Blancs' : 'Les Noirs'} ont roqué !`);
        }

        setGameState({
          ...updatedGameState,
          board: newBoard,
          currentPlayer: nextPlayer,
          selectedSquare: null,
          gameOver,
          winner,
        });

        setActionMode('move');
      } else {
        const piece = gameState.board[row][col];
        if (piece && piece.color === gameState.currentPlayer) {
          setGameState(prev => ({ ...prev, selectedSquare: position }));
        } else {
          setGameState(prev => ({ ...prev, selectedSquare: null }));
        }
      }
    } else {
      const piece = gameState.board[row][col];
      if (piece && piece.color === gameState.currentPlayer) {
        setGameState(prev => ({ ...prev, selectedSquare: position }));
      }
    }
  }, [gameState, actionMode]);

  const resetGame = () => {
    setGameState({
      board: initializeBoard(),
      currentPlayer: 'white',
      selectedSquare: null,
      removedSquares: new Set(),
      gameOver: false,
      winner: null,
      castlingRights: {
        whiteKingside: true,
        whiteQueenside: true,
        blackKingside: true,
        blackQueenside: true,
      },
      kingMoved: {
        white: false,
        black: false,
      },
      rookMoved: {
        whiteKingside: false,
        whiteQueenside: false,
        blackKingside: false,
        blackQueenside: false,
      },
    });
    setActionMode('move');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="trophy" size={24} color="#f59e0b" />
          <Text style={styles.title}>Chess Variant 64</Text>
        </View>

        {/* Player Indicator */}
        <View style={styles.playerIndicator}>
          <Text style={styles.playerText}>Tour du joueur</Text>
          <Text style={styles.currentPlayer}>
            {gameState.currentPlayer === 'white' ? 'BLANC' : 'NOIR'}
          </Text>
        </View>

        {/* Chess Board */}
        <View style={styles.boardContainer}>
          <ChessBoard
            board={gameState.board}
            selectedSquare={gameState.selectedSquare}
            removedSquares={gameState.removedSquares}
            onSquarePress={handleSquarePress}
            currentPlayer={gameState.currentPlayer}
          />
        </View>

        {/* Action Controls */}
        {!gameState.gameOver && (
          <View style={styles.controls}>
            <Text style={styles.controlsTitle}>Choisissez votre action</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.moveButton,
                  actionMode === 'move' && styles.activeButton,
                ]}
                onPress={() => setActionMode('move')}
                activeOpacity={0.8}
              >
                <Ionicons name="move" size={16} color="#ffffff" />
                <Text style={styles.buttonText}>Déplacer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.removeButton,
                  actionMode === 'remove' && styles.activeRemoveButton,
                ]}
                onPress={() => setActionMode('remove')}
                activeOpacity={0.8}
              >
                <Text style={styles.removeIcon}>✕</Text>
                <Text style={styles.buttonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.instruction}>
              {actionMode === 'move' 
                ? 'Sélectionnez une pièce puis sa destination'
                : 'Touchez une case vide pour la supprimer'
              }
            </Text>
          </View>
        )}

        {/* Game Over */}
        {gameState.gameOver && (
          <View style={styles.gameOver}>
            <Ionicons name="trophy" size={32} color="#f59e0b" />
            <Text style={styles.winnerText}>
              {gameState.winner === 'white' ? 'Les Blancs' : 'Les Noirs'} ont gagné !
            </Text>
          </View>
        )}

        {/* Reset Button */}
        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={resetGame}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color="#ffffff" />
          <Text style={styles.resetText}>Nouvelle Partie</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#312e2b',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  playerIndicator: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  playerText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  currentPlayer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  boardContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 110,
    justifyContent: 'center',
  },
  moveButton: {
    backgroundColor: '#5cb85c',
  },
  removeButton: {
    backgroundColor: '#666666',
  },
  activeButton: {
    backgroundColor: '#4a9eff',
  },
  activeRemoveButton: {
    backgroundColor: '#d9534f',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  removeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  instruction: {
    fontSize: 13,
    color: '#cccccc',
    textAlign: 'center',
    maxWidth: screenWidth - 60,
  },
  gameOver: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  winnerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9534f',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  resetText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});