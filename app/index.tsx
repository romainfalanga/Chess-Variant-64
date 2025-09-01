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
import GameSetup from '@/components/GameSetup';
import ChessTimer from '@/components/ChessTimer';
import { GameState, Position, GameSettings, GameConfig } from '@/types/chess';
import { initializeBoard, isValidMove, makeMove, isInCheck, isCheckmate, updateCastlingRights } from '@/utils/chessLogic';

const { width: screenWidth } = Dimensions.get('window');

export default function ChessGame() {
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    timeLimit: 5,
    removalsPerPlayer: 3,
    gameStarted: false,
  });

  const [gameState, setGameState] = useState<GameState>({
    board: initializeBoard(),
    currentPlayer: 'white',
    selectedSquare: null,
    removedSquares: new Set(),
    gameOver: false,
    winner: null,
    removalsUsed: { white: 0, black: 0 },
    timeLeft: { white: 300, black: 300 }, // 5 minutes par défaut
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
  const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);

  const handleTimeUp = (player: Player) => {
    const winner = player === 'white' ? 'black' : 'white';
    setGameState(prev => ({
      ...prev,
      gameOver: true,
      winner,
    }));
    Alert.alert('Temps écoulé !', `Le joueur ${winner === 'white' ? 'Blanc' : 'Noir'} gagne par forfait !`);
  };

  const handleTimeUpdate = (player: Player, newTime: number) => {
    setGameState(prev => ({
      ...prev,
      timeLeft: {
        ...prev.timeLeft,
        [player]: newTime,
      },
    }));
  };

  const handleSettingsChange = (settings: GameSettings) => {
    setGameConfig(prev => ({ ...prev, ...settings }));
  };

  const startGame = () => {
    // Initialiser les temps en fonction de la configuration
    const timeInSeconds = gameConfig.timeLimit * 60;
    setGameState(prev => ({
      ...prev,
      timeLeft: { white: timeInSeconds, black: timeInSeconds },
    }));
    setGameConfig(prev => ({ ...prev, gameStarted: true }));
  };

  const handleSquarePress = useCallback((row: number, col: number) => {
    if (gameState.gameOver) return;

    const position: Position = [row, col];
    const positionKey = `${row}-${col}`;

    if (actionMode === 'remove') {
      // Vérifier si le joueur a encore des suppressions disponibles
      if (gameState.removalsUsed[gameState.currentPlayer] >= gameConfig.removalsPerPlayer) {
        Alert.alert('Limite atteinte', `Vous avez déjà utilisé toutes vos ${gameConfig.removalsPerPlayer} suppressions`);
        return;
      }

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

      const newRemovalsUsed = { ...gameState.removalsUsed };
      newRemovalsUsed[gameState.currentPlayer]++;

      setGameState(prev => ({
        ...prev,
        removedSquares: newRemovedSquares,
        removalsUsed: newRemovalsUsed,
        currentPlayer: prev.currentPlayer === 'white' ? 'black' : 'white',
      }));

      setActionMode('move');
      setPossibleMoves([]);
      return;
    }

    if (gameState.selectedSquare) {
      const [selectedRow, selectedCol] = gameState.selectedSquare;
      
      if (selectedRow === row && selectedCol === col) {
        setGameState(prev => ({ ...prev, selectedSquare: null }));
        setPossibleMoves([]);
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
        setPossibleMoves([]);
      } else {
        const piece = gameState.board[row][col];
        if (piece && piece.color === gameState.currentPlayer) {
          setGameState(prev => ({ ...prev, selectedSquare: position }));
          // Calculer et afficher les mouvements possibles
          const moves: Position[] = [];
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMove(gameState.board, position, [toRow, toCol], gameState.removedSquares, gameState)) {
                const moveResult = makeMove(gameState.board, position, [toRow, toCol], gameState);
                if (!isInCheck(moveResult.board, gameState.currentPlayer, gameState.removedSquares)) {
                  moves.push([toRow, toCol]);
                }
              }
            }
          }
          setPossibleMoves(moves);
        } else {
          setGameState(prev => ({ ...prev, selectedSquare: null }));
          setPossibleMoves([]);
        }
      }
    } else {
      const piece = gameState.board[row][col];
      if (piece && piece.color === gameState.currentPlayer) {
        setGameState(prev => ({ ...prev, selectedSquare: position }));
        // Calculer et afficher les mouvements possibles
        const moves: Position[] = [];
        for (let toRow = 0; toRow < 8; toRow++) {
          for (let toCol = 0; toCol < 8; toCol++) {
            if (isValidMove(gameState.board, position, [toRow, toCol], gameState.removedSquares, gameState)) {
              const moveResult = makeMove(gameState.board, position, [toRow, toCol], gameState);
              if (!isInCheck(moveResult.board, gameState.currentPlayer, gameState.removedSquares)) {
                moves.push([toRow, toCol]);
              }
            }
          }
        }
        setPossibleMoves(moves);
      }
    }
  }, [gameState, actionMode, gameConfig.removalsPerPlayer]);

  const resetGame = () => {
    setGameConfig({
      timeLimit: 5,
      removalsPerPlayer: 3,
      gameStarted: false,
    });
    setGameState({
      board: initializeBoard(),
      currentPlayer: 'white',
      selectedSquare: null,
      removedSquares: new Set(),
      gameOver: false,
      winner: null,
      removalsUsed: { white: 0, black: 0 },
      timeLeft: { white: 300, black: 300 },
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
    setPossibleMoves([]);
  };

  // Afficher l'écran de configuration si le jeu n'a pas commencé
  if (!gameConfig.gameStarted) {
    return (
      <GameSetup
        settings={gameConfig}
        onSettingsChange={handleSettingsChange}
        onStartGame={startGame}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Layout principal en 3 zones */}
      <View style={styles.gameLayout}>
        
        {/* Chronomètre invisible pour gérer le décompte */}
        <ChessTimer
          timeLeft={gameState.timeLeft}
          currentPlayer={gameState.currentPlayer}
          gameOver={gameState.gameOver}
          onTimeUp={handleTimeUp}
          onTimeUpdate={handleTimeUpdate}
        />
        
        {/* Zone joueur noir (haut) */}
        <View style={styles.playerZone}>
          <View style={styles.playerInfo}>
            <View style={styles.timerContainer}>
              <Text style={[
                styles.timeText,
                gameState.currentPlayer === 'black' && styles.activeTimeText,
                gameState.timeLeft.black <= 10 && styles.criticalTimeText,
              ]}>
                {Math.floor(gameState.timeLeft.black / 60)}:{(gameState.timeLeft.black % 60).toString().padStart(2, '0')}
              </Text>
              <Text style={styles.playerLabel}>NOIR</Text>
            </View>
            <View style={styles.removalsInfo}>
              <Text style={styles.removalsText}>
                {gameConfig.removalsPerPlayer - gameState.removalsUsed.black} ✕
              </Text>
            </View>
          </View>
        </View>

        {/* Zone centrale - Échiquier et contrôles */}
        <View style={styles.centerZone}>
          {/* Bouton retour au menu centré */}
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={resetGame}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={20} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.boardContainer}>
            <ChessBoard
              board={gameState.board}
              selectedSquare={gameState.selectedSquare}
              removedSquares={gameState.removedSquares}
              possibleMoves={possibleMoves}
              onSquarePress={handleSquarePress}
              currentPlayer={gameState.currentPlayer}
            />
          </View>
          
          {/* Contrôles compacts */}
          {!gameState.gameOver && (
            <View style={styles.compactControls}>
              {/* Toggle binaire pour mode de jeu */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    styles.toggleLeft,
                    actionMode === 'move' && styles.toggleActive,
                  ]}
                  onPress={() => setActionMode('move')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="move" size={16} color={actionMode === 'move' ? "#ffffff" : "#666666"} />
                  <Text style={[
                    styles.toggleText,
                    actionMode === 'move' && styles.toggleActiveText,
                  ]}>
                    Déplacer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    styles.toggleRight,
                    actionMode === 'remove' && styles.toggleActiveRemove,
                    gameState.removalsUsed[gameState.currentPlayer] >= gameConfig.removalsPerPlayer && styles.toggleDisabled,
                  ]}
                  onPress={() => setActionMode('remove')}
                  activeOpacity={0.8}
                  disabled={gameState.removalsUsed[gameState.currentPlayer] >= gameConfig.removalsPerPlayer}
                >
                  <Text style={[
                    styles.removeIcon,
                    actionMode === 'remove' && styles.toggleActiveText,
                    gameState.removalsUsed[gameState.currentPlayer] >= gameConfig.removalsPerPlayer && styles.toggleDisabledText,
                  ]}>
                    ✕
                  </Text>
                  <Text style={[
                    styles.toggleText,
                    actionMode === 'remove' && styles.toggleActiveText,
                    gameState.removalsUsed[gameState.currentPlayer] >= gameConfig.removalsPerPlayer && styles.toggleDisabledText,
                  ]}>
                    Supprimer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Game Over Overlay */}
          {gameState.gameOver && (
            <View style={styles.gameOverOverlay}>
              <View style={styles.gameOverCard}>
                <Ionicons name="trophy" size={32} color="#f59e0b" />
                <Text style={styles.winnerText}>
                  {gameState.winner === 'white' ? 'BLANC' : 'NOIR'} GAGNE !
                </Text>
                <TouchableOpacity 
                  style={styles.newGameButton} 
                  onPress={resetGame}
                  activeOpacity={0.8}
                >
                  <Text style={styles.newGameText}>Nouvelle partie</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Zone joueur blanc (bas) */}
        <View style={styles.playerZone}>
          <View style={styles.playerInfo}>
            <View style={styles.removalsInfo}>
              <Text style={styles.removalsText}>
                {gameConfig.removalsPerPlayer - gameState.removalsUsed.white} ✕
              </Text>
            </View>
            <View style={styles.timerContainer}>
              <Text style={styles.playerLabel}>BLANC</Text>
              <Text style={[
                styles.timeText,
                gameState.currentPlayer === 'white' && styles.activeTimeText,
                gameState.timeLeft.white <= 10 && styles.criticalTimeText,
              ]}>
                {Math.floor(gameState.timeLeft.white / 60)}:{(gameState.timeLeft.white % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#312e2b',
  },
  gameLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  playerZone: {
    height: 80,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    backgroundColor: '#4a5568',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeTimer: {
    borderColor: '#4a9eff',
    backgroundColor: '#5a6578',
  },
  playerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  activeTimeText: {
    color: '#4a9eff',
  },
  criticalTimeText: {
    color: '#dc2626',
  },
  removalsInfo: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  removalsText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  centerZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  compactControls: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    gap: 6,
  },
  toggleLeft: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  toggleRight: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  toggleActive: {
    backgroundColor: '#5cb85c',
  },
  toggleActiveRemove: {
    backgroundColor: '#d9534f',
  },
  toggleDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  toggleActiveText: {
    color: '#ffffff',
  },
  toggleDisabledText: {
    color: '#444444',
  },
  removeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
  },
  menuButton: {
    alignSelf: 'center',
    marginBottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverCard: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  winnerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
    marginBottom: 20,
  },
  newGameButton: {
    backgroundColor: '#5cb85c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newGameText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});