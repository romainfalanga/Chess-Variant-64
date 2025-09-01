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
import DraftInterface from '@/components/DraftInterface';
import { GameState, Position, GameSettings, GameConfig } from '@/types/chess';
import { 
  initializeBoard, 
  initializeDraftBoard, 
  getAvailableDraftPieces,
  isValidMove, 
  makeMove, 
  isInCheck, 
  isCheckmate, 
  updateCastlingRights 
} from '@/utils/chessLogic';

const { width: screenWidth } = Dimensions.get('window');

export default function ChessGame() {
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    timeLimit: 5,
    removalsPerPlayer: 3,
    draftMode: false,
    gameStarted: false,
    draftPhase: false,
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
    
    if (gameConfig.draftMode) {
      // Mode draft : initialiser avec seulement les pions
      setGameState(prev => ({
        ...prev,
        board: initializeDraftBoard(),
        timeLeft: { white: timeInSeconds, black: timeInSeconds },
        draftState: {
          availablePieces: {
            white: getAvailableDraftPieces(),
            black: getAvailableDraftPieces(),
          },
          selectedPiece: null,
          currentDraftPlayer: 'white',
        },
        currentPlayer: 'white', // Le chrono des blancs commence immédiatement
      }));
      setGameConfig(prev => ({ ...prev, gameStarted: true, draftPhase: true }));
    } else {
      // Mode classique
      setGameState(prev => ({
        ...prev,
        board: initializeBoard(),
        timeLeft: { white: timeInSeconds, black: timeInSeconds },
      }));
      setGameConfig(prev => ({ ...prev, gameStarted: true, draftPhase: false }));
    }
  };

  const handleDraftPieceSelect = (piece: PieceType) => {
    if (!gameState.draftState) return;
    
    setGameState(prev => ({
      ...prev,
      draftState: prev.draftState ? {
        ...prev.draftState,
        selectedPiece: piece,
      } : undefined,
    }));
  };

  const handleDraftPlacement = (row: number, col: number) => {
    if (!gameState.draftState || !gameState.draftState.selectedPiece) return;
    
    const targetRow = gameState.draftState.currentDraftPlayer === 'white' ? 7 : 0;
    if (row !== targetRow) return;
    
    // Vérifier que la case est libre
    if (gameState.board[row][col] !== null) return;
    
    const newBoard = gameState.board.map(boardRow => [...boardRow]);
    newBoard[row][col] = {
      type: gameState.draftState.selectedPiece,
      color: gameState.draftState.currentDraftPlayer,
    };
    
    // Retirer la pièce de la réserve
    const newAvailablePieces = { ...gameState.draftState.availablePieces };
    const playerPieces = [...newAvailablePieces[gameState.draftState.currentDraftPlayer]];
    const pieceIndex = playerPieces.indexOf(gameState.draftState.selectedPiece);
    if (pieceIndex > -1) {
      playerPieces.splice(pieceIndex, 1);
      newAvailablePieces[gameState.draftState.currentDraftPlayer] = playerPieces;
    }
    
    // Changer de joueur
    const nextPlayer = gameState.draftState.currentDraftPlayer === 'white' ? 'black' : 'white';
    
    // Vérifier si la phase de draft est terminée
    const totalPiecesLeft = newAvailablePieces.white.length + newAvailablePieces.black.length;
    const isDraftComplete = totalPiecesLeft === 0;
    
    if (isDraftComplete) {
      // Terminer la phase de draft et commencer la partie
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        currentPlayer: 'white', // Les blancs commencent toujours
        draftState: undefined,
      }));
      setGameConfig(prev => ({ ...prev, draftPhase: false }));
    } else {
      setGameState(prev => ({
        ...prev,
        board: newBoard,
        currentPlayer: nextPlayer, // Change de joueur après chaque placement
        draftState: {
          ...gameState.draftState!,
          availablePieces: newAvailablePieces,
          selectedPiece: null,
          currentDraftPlayer: nextPlayer,
        },
      }));
    }
  };

  const handleSquarePress = useCallback((row: number, col: number) => {
    if (gameState.gameOver) return;
    
    // Mode draft : placement des pièces
    if (gameConfig.draftPhase && gameState.draftState) {
      handleDraftPlacement(row, col);
      return;
    }

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
      draftMode: false,
      gameStarted: false,
      draftPhase: false,
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
      draftState: undefined,
    });
    setActionMode('move');
    setPossibleMoves([]);
  };

  // Utiliser le composant ChessTimer pour gérer les chronomètres
  const renderTimers = () => (
    <ChessTimer
      timeLeft={gameState.timeLeft}
      currentPlayer={gameState.currentPlayer}
      gameOver={gameState.gameOver}
      removalsUsed={gameState.removalsUsed}
      maxRemovals={gameConfig.removalsPerPlayer}
      onTimeUp={handleTimeUp}
      onTimeUpdate={handleTimeUpdate}
    />
  );

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
        
        {/* Bouton menu en haut au centre */}
        <View style={styles.topMenuContainer}>
          <TouchableOpacity 
            style={styles.topMenuButton} 
            onPress={resetGame}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Chronomètres intégrés */}
        {renderTimers()}

        {/* Zone centrale - Échiquier et contrôles */}
        <View style={styles.centerZone}>
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

        {/* Contrôles en bas de l'écran - Interface de draft ou contrôles normaux */}
        {!gameState.gameOver && (
          <View style={styles.bottomControls}>
            {gameConfig.draftPhase && gameState.draftState ? (
              /* Interface de draft */
              <DraftInterface
                availablePieces={gameState.draftState.availablePieces[gameState.draftState.currentDraftPlayer]}
                selectedPiece={gameState.draftState.selectedPiece}
                currentPlayer={gameState.draftState.currentDraftPlayer}
                onPieceSelect={handleDraftPieceSelect}
              />
            ) : (
              /* Toggle binaire pour mode de jeu normal */
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
            )}
          </View>
        )}
        
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
    justifyContent: 'flex-start',
  },
  topMenuContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  topMenuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  boardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
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