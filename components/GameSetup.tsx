import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameSettings } from '@/types/chess';

interface GameSetupProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onStartGame: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const timeOptions = [3, 5, 10, 15];
const removalOptions = [1, 3, 5];

export default function GameSetup({ settings, onSettingsChange, onStartGame }: GameSetupProps) {
  const updateTimeLimit = (time: number) => {
    onSettingsChange({ ...settings, timeLimit: time });
  };

  const updateRemovals = (removals: number) => {
    onSettingsChange({ ...settings, removalsPerPlayer: removals });
  };

  const toggleDraftMode = () => {
    onSettingsChange({ ...settings, draftMode: !settings.draftMode });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Chess Variant Draft</Text>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temps de la partie</Text>
          <View style={styles.optionsGrid}>
            {timeOptions.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.optionButton,
                  styles.timeButton,
                  settings.timeLimit === time && styles.selectedButton,
                ]}
                onPress={() => updateTimeLimit(time)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.optionText,
                  settings.timeLimit === time && styles.selectedText,
                ]}>
                  {time} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Draft Mode Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activer le Mode Draft ?</Text>
          <View style={styles.draftToggleContainer}>
            <TouchableOpacity
              style={[
                styles.draftToggleButton,
                styles.draftToggleLeft,
                !settings.draftMode && styles.selectedDraftButton,
              ]}
              onPress={() => onSettingsChange({ ...settings, draftMode: false })}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.draftToggleText,
                !settings.draftMode && styles.selectedText,
              ]}>
                Non
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.draftToggleButton,
                styles.draftToggleRight,
                settings.draftMode && styles.selectedDraftButton,
              ]}
              onPress={() => onSettingsChange({ ...settings, draftMode: true })}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.draftToggleText,
                settings.draftMode && styles.selectedText,
              ]}>
                Oui
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Removals Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cases supprimables par joueur</Text>
          <View style={styles.optionsGrid}>
            {removalOptions.map((removals) => (
              <TouchableOpacity
                key={removals}
                style={[
                  styles.optionButton,
                  styles.removalButton,
                  settings.removalsPerPlayer === removals && styles.selectedRemovalButton,
                ]}
                onPress={() => updateRemovals(removals)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.optionText,
                  settings.removalsPerPlayer === removals && styles.selectedText,
                ]}>
                  {removals}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Game Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartGame}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={20} color="#ffffff" />
          <Text style={styles.startButtonText}>Lancer la partie</Text>
        </TouchableOpacity>

        {/* Boutons Faire un don et Telegram */}
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity
            style={styles.donationButton}
            onPress={() => Linking.openURL('https://fr.tipeee.com/romain-falanga')}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={18} color="#ffffff" />
            <Text style={styles.donationButtonText}>Faire un don</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.telegramButton}
            onPress={() => Linking.openURL('https://t.me/RomainFLGpublic')}
            activeOpacity={0.8}
          >
            <Ionicons name="paper-plane" size={18} color="#4a5568" />
            <Text style={styles.telegramButtonText}>Telegram</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
    marginHorizontal: 20,
    fontWeight: '400',
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    fontWeight: '500',
  },
  section: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  timeButton: {
    backgroundColor: '#4a5568',
    borderColor: '#4a5568',
  },
  removalButton: {
    backgroundColor: '#4a5568',
    borderColor: '#4a5568',
  },
  selectedButton: {
    backgroundColor: '#4a9eff',
    borderColor: '#4a9eff',
  },
  selectedRemovalButton: {
    backgroundColor: '#d9534f',
    borderColor: '#d9534f',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedText: {
    color: '#ffffff',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5cb85c',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  draftToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#4a5568',
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  draftToggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  draftToggleLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  draftToggleRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  selectedDraftButton: {
    backgroundColor: '#4a9eff',
  },
  draftToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cccccc',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
    justifyContent: 'center',
  },
  donationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  donationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  telegramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#4a5568',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  telegramButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginLeft: 6,
  },
});