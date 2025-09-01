import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { PieceType, Player } from '@/types/chess';

interface DraftInterfaceProps {
  availablePieces: PieceType[];
  selectedPiece: PieceType | null;
  currentPlayer: Player;
  onPieceSelect: (piece: PieceType) => void;
}

const pieceNames = {
  rook: 'Tour',
  knight: 'Cavalier',
  bishop: 'Fou',
  queen: 'Dame',
  king: 'Roi',
};

const pieceSymbols = {
  white: {
    rook: '♖',
    knight: '♘',
    bishop: '♗',
    queen: '♕',
    king: '♔',
  },
  black: {
    rook: '♜',
    knight: '♞',
    bishop: '♝',
    queen: '♛',
    king: '♚',
  },
};

export default function DraftInterface({
  availablePieces,
  selectedPiece,
  currentPlayer,
  onPieceSelect,
}: DraftInterfaceProps) {
  // Compter les pièces disponibles
  const pieceCounts = availablePieces.reduce((acc, piece) => {
    acc[piece] = (acc[piece] || 0) + 1;
    return acc;
  }, {} as Record<PieceType, number>);

  const uniquePieces = Object.keys(pieceCounts) as PieceType[];

  // Couleurs dynamiques selon le joueur
  const backgroundColor = currentPlayer === 'white' ? '#ffffff' : '#000000';
  const textColor = currentPlayer === 'white' ? '#000000' : '#ffffff';
  const instructionColor = currentPlayer === 'white' ? '#666666' : '#cccccc';
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>
        Phase de placement - {currentPlayer === 'white' ? 'BLANC' : 'NOIR'}
      </Text>
      <Text style={[styles.instruction, { color: instructionColor }]}>
        Choisissez une pièce puis cliquez sur votre première rangée
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.piecesContainer}
      >
        {uniquePieces.map((pieceType) => {
          const count = pieceCounts[pieceType];
          const isSelected = selectedPiece === pieceType;
          
          return (
            <TouchableOpacity
              key={pieceType}
              style={[
                styles.pieceButton,
                isSelected && styles.selectedPieceButton,
              ]}
              onPress={() => onPieceSelect(pieceType)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.pieceSymbol,
                { color: currentPlayer === 'white' ? '#ffffff' : '#000000' }
              ]}>
                {pieceSymbols[currentPlayer][pieceType]}
              </Text>
              <Text style={styles.pieceName}>
                {pieceNames[pieceType]}
              </Text>
              {count > 1 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>×{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instruction: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  piecesContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  pieceButton: {
    backgroundColor: '#4a5568',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPieceButton: {
    backgroundColor: '#4a9eff',
    borderColor: '#4a9eff',
  },
  pieceSymbol: {
    fontSize: 24,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  pieceName: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  countBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#dc3545',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});