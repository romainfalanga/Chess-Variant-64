import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player } from '@/types/chess';

interface ChessTimerProps {
  timeLeft: { white: number; black: number };
  currentPlayer: Player;
  gameOver: boolean;
  onTimeUp: (player: Player) => void;
  onTimeUpdate: (player: Player, newTime: number) => void;
}

export default function ChessTimer({
  timeLeft,
  currentPlayer,
  gameOver,
  onTimeUp,
  onTimeUpdate,
}: ChessTimerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (gameOver) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Démarrer le chronomètre pour le joueur actuel
    intervalRef.current = setInterval(() => {
      const currentTime = timeLeft[currentPlayer];
      
      if (currentTime <= 1) {
        onTimeUp(currentPlayer);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        onTimeUpdate(currentPlayer, currentTime - 1);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentPlayer, gameOver, timeLeft, onTimeUp, onTimeUpdate]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerStyle = (player: Player) => {
    const isActive = currentPlayer === player && !gameOver;
    const isLowTime = timeLeft[player] <= 30;
    const isCriticalTime = timeLeft[player] <= 10;
    
    return [
      styles.timer,
      player === 'white' ? styles.whiteTimer : styles.blackTimer,
      isActive && styles.activeTimer,
      isLowTime && styles.lowTimeTimer,
      isCriticalTime && styles.criticalTimeTimer,
    ];
  };

  return (
    <View style={styles.container}>
      {/* Timer joueur noir (en haut) */}
      <View style={[styles.blackTimerContainer]}>
        <View style={getTimerStyle('black')}>
          <Text style={[styles.playerLabel, styles.blackLabel]}>NOIR</Text>
          <Text style={[
            styles.timeText, 
            styles.blackTimeText,
            currentPlayer === 'black' && !gameOver && styles.activeTimeText,
            timeLeft.black <= 10 && styles.criticalTimeText,
          ]}>
            {formatTime(timeLeft.black)}
          </Text>
        </View>
      </View>

      {/* Timer joueur blanc (en bas) */}
      <View style={[styles.whiteTimerContainer]}>
        <View style={getTimerStyle('white')}>
          <Text style={styles.playerLabel}>BLANC</Text>
          <Text style={[
            styles.timeText,
            currentPlayer === 'white' && !gameOver && styles.activeTimeText,
            timeLeft.white <= 10 && styles.criticalTimeText,
          ]}>
            {formatTime(timeLeft.white)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  timer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 4,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  whiteTimer: {
    backgroundColor: '#f8f9fa',
  },
  blackTimer: {
    backgroundColor: '#343a40',
  },
  whiteTimerContainer: {
    // Timer blanc normal (en bas)
  },
  blackTimerContainer: {
    // Timer noir normal (en haut)
  },
  activeTimer: {
    borderColor: '#4a9eff',
    shadowColor: '#4a9eff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  lowTimeTimer: {
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  criticalTimeTimer: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
    shadowColor: '#dc2626',
  },
  playerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 1,
  },
  blackLabel: {
    color: '#f8f9fa',
  },
  timeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'monospace',
    marginVertical: 4,
  },
  blackTimeText: {
    color: '#f8f9fa',
  },
  criticalTimeText: {
    color: '#dc2626',
  },
  activeTimeText: {
    color: '#4a9eff',
  },
});