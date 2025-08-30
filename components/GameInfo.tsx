import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player } from '@/types/chess';

interface GameInfoProps {
  removalsUsed: { white: number; black: number };
  maxRemovals: number;
  currentPlayer: Player;
  gameOver: boolean;
}

export default function GameInfo({ 
  removalsUsed, 
  maxRemovals, 
  currentPlayer, 
  gameOver 
}: GameInfoProps) {
  const whiteRemaining = maxRemovals - removalsUsed.white;
  const blackRemaining = maxRemovals - removalsUsed.black;

  return (
    <View style={styles.container}>
      {/* Info joueur noir (en haut, retournée) */}
      <View style={[styles.playerInfo, styles.blackInfo]}>
        <Text style={[styles.removalsText, styles.blackText]}>
          Suppressions: {blackRemaining}
        </Text>
      </View>

      {/* Info joueur blanc (en bas) */}
      <View style={[styles.playerInfo, styles.whiteInfo]}>
        <Text style={styles.removalsText}>
          Suppressions: {whiteRemaining}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  playerInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  blackInfo: {
    // Normal orientation for black player too
  },
  whiteInfo: {
    // Normal orientation for white player
  },
  removalsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  blackText: {
    color: '#ffffff',
  },
});