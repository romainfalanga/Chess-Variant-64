import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Piece } from '@/types/chess';

interface ChessSquareProps {
  piece: Piece | null;
  isLight: boolean;
  isSelected: boolean;
  isRemoved: boolean;
  isPossibleMove: boolean;
  onPress: () => void;
  canSelect: boolean;
  size: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Pièces exactement comme Chess.com
const chessPieces = {
  white: {
    king: '♔',
    queen: '♕', 
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜', 
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

export default function ChessSquare({
  piece,
  isLight,
  isSelected,
  isRemoved,
  isPossibleMove,
  onPress,
  canSelect,
  size,
}: ChessSquareProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (isRemoved) return;
    
    scale.value = withSequence(
      withSpring(0.95, { duration: 80 }),
      withSpring(1, { duration: 80 })
    );
    
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Couleurs exactes Chess.com
  const lightColor = '#f0d9b5';  // Beige clair
  const darkColor = '#b58863';   // Brun-vert
  const selectedColor = '#f7dc6f'; // Jaune sélection
  const removedColor = '#dc3545'; // Rouge suppression

  const getBackgroundColor = () => {
    if (isRemoved) return removedColor;
    if (isSelected) return selectedColor;
    if (isPossibleMove) return '#90EE90'; // Vert clair pour les mouvements possibles
    return isLight ? lightColor : darkColor;
  };

  const getPieceSymbol = (piece: Piece): string => {
    return chessPieces[piece.color][piece.type];
  };

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.square,
        {
          width: size,
          height: size,
          backgroundColor: getBackgroundColor(),
        },
        animatedStyle
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
      disabled={isRemoved}
    >
      {piece && !isRemoved && (
        <Text style={[
          styles.piece,
          { 
            fontSize: size * 0.7,
            color: piece.color === 'white' ? '#ffffff' : '#000000',
            textShadowColor: piece.color === 'white' ? '#000000' : 'transparent',
            textShadowOffset: piece.color === 'white' ? { width: 1, height: 1 } : { width: 0, height: 0 },
            textShadowRadius: piece.color === 'white' ? 1 : 0,
          }
        ]}>
          {getPieceSymbol(piece)}
        </Text>
      )}

      {isRemoved && (
        <View style={styles.removedOverlay}>
          <Text style={[styles.removedX, { fontSize: size * 0.4 }]}>✕</Text>
        </View>
      )}

      {isSelected && (
        <View style={styles.selectedBorder} />
      )}

      {isPossibleMove && !isRemoved && (
        <View style={styles.possibleMoveIndicator}>
          {piece ? (
            // Indicateur de capture (cercle rouge)
            <View style={[styles.captureIndicator, { width: size * 0.8, height: size * 0.8 }]} />
          ) : (
            // Indicateur de mouvement libre (point vert)
            <View style={[styles.moveIndicator, { width: size * 0.3, height: size * 0.3 }]} />
          )}
        </View>
      )}
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  square: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  piece: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  removedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
  },
  removedX: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  selectedBorder: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderWidth: 3,
    borderColor: '#f39c12',
    borderRadius: 2,
  },
  selectableDot: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#28a745',
  },
  possibleMoveIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moveIndicator: {
    backgroundColor: '#28a745',
    borderRadius: 50,
    opacity: 0.8,
  },
  captureIndicator: {
    borderWidth: 3,
    borderColor: '#dc3545',
    borderRadius: 50,
    backgroundColor: 'transparent',
    opacity: 0.8,
  },
});