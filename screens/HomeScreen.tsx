import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  AppState,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import ThemeContext, { DarkTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { formatTime } from '../utils/helpers';
import styles from '../styles/styles';

type FocusSession = {
  id: string;
  category: string;
  durationSeconds: number;
  createdAt: string;
  distractCount: number;
};

const DEFAULT_MINUTES = 25;

export default function HomeScreen() {
  const themeContext = React.useContext(ThemeContext);
  const theme = themeContext?.theme || DarkTheme;
  const navigation = useNavigation<any>();

  const [workMinutes, setWorkMinutes] = useState(DEFAULT_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [category, setCategory] = useState('Ders');
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [distractions, setDistractions] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const appStateRef = useRef(AppState.currentState);

  // Swipe
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dy) < 20,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) navigation.navigate('Reports');
      },
    }),
  ).current;

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prevState = appStateRef.current;

      if (prevState === 'active' && nextState === 'background') {
        if (isRunning) {
          setDistractions(d => d + 1);
          setIsRunning(false);
        }
      }

      if (prevState === 'background' && nextState === 'active') {
        if (!isRunning && secondsLeft !== workMinutes * 60) {
          setShowResumePrompt(true);
        }
      }

      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, [isRunning, secondsLeft, workMinutes]);

  useEffect(() => {
    const load = async () => {
      try {
        const json = await AsyncStorage.getItem('sessions');
        if (json) setSessions(JSON.parse(json));
      } catch (e) {
        console.log('loadSessions error', e);
      }
    };
    load();
  }, []);

  const saveCurrentSession = async (currentSecondsLeft: number) => {
    const durationSeconds = workMinutes * 60 - currentSecondsLeft;
    if (durationSeconds <= 0) return;

    const newSession: FocusSession = {
      id: Date.now().toString(),
      category,
      durationSeconds,
      createdAt: new Date().toISOString(),
      distractCount: distractions,
    };

    try {
      const updated = [...sessions, newSession];
      setSessions(updated);
      await AsyncStorage.setItem('sessions', JSON.stringify(updated));
    } catch (e) {
      console.log('saveSession error', e);
    }

    setDistractions(0);
  };

  // Timer
  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          saveCurrentSession(prev);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  const handleStartPause = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(workMinutes * 60);
      setDistractions(0);
    }
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    if (secondsLeft !== workMinutes * 60) {
      saveCurrentSession(secondsLeft);
    }
    setSecondsLeft(workMinutes * 60);
    setIsRunning(false);
    setDistractions(0);
  };

  const handleCategoryChange = (newCategory: string) => {
    if (isRunning) return;
    if (secondsLeft !== workMinutes * 60) {
      saveCurrentSession(secondsLeft);
    }
    setSecondsLeft(workMinutes * 60);
    setIsRunning(false);
    setDistractions(0);
    setCategory(newCategory);
  };

  const changeWorkMinutes = (delta: number) => {
    if (isRunning) return;
    setWorkMinutes(prev => {
      const next = Math.min(90, Math.max(1, prev + delta));
      setSecondsLeft(next * 60);
      return next;
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}
      {...panResponder.panHandlers}
    >
      {/* Resume Modal */}
      <Modal transparent visible={showResumePrompt} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalText, { color: theme.text }]}>Devam etmek ister misin?</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.modalYes, { backgroundColor: theme.accent }]}
                onPress={() => {
                  setShowResumePrompt(false);
                  setIsRunning(true);
                }}
              >
                <Text style={styles.modalYesText}>Evet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalNo, { borderColor: theme.buttonSecondaryBorder }]}
                onPress={() => setShowResumePrompt(false)}
              >
                <Text style={[styles.modalNoText, { color: theme.text }]}>Hayır</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>FocusApp</Text>
        <ThemeToggle />
      </View>

      <View
        style={[
          styles.pickerWrap,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity: isRunning ? 0.55 : 1,
            height: 50,
          },
        ]}
      >
        <Picker
          enabled={!isRunning}
          selectedValue={category}
          onValueChange={v => handleCategoryChange(v)}
          style={{ width: 120, height: 50, color: theme.text }}
          dropdownIconColor={theme.text}
        >
          <Picker.Item label="Ders" value="Ders" />
          <Picker.Item label="İş" value="İş" />
          <Picker.Item label="Proje" value="Proje" />
          <Picker.Item label="Sınav" value="Sınav" />
          <Picker.Item label="Kişisel" value="Kişisel" />
        </Picker>
      </View>

      <View style={styles.timerRow}>
        <TouchableOpacity
          style={[styles.smallAdjustButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => changeWorkMinutes(-1)}
        >
          <Text style={[styles.smallAdjustText, { color: theme.text }]}>−</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.timer, { color: theme.text }]}>{formatTime(secondsLeft)}</Text>
          <Text style={[styles.smallMinutesLabel, { color: theme.muted }]}>{workMinutes} dk</Text>
        </View>

        <TouchableOpacity
          style={[styles.smallAdjustButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => changeWorkMinutes(1)}
        >
          <Text style={[styles.smallAdjustText, { color: theme.text }]}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.distractionText, { color: theme.accent }]}>Dikkat Dağınıklığı: {distractions}</Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={handleStartPause}>
          <Text style={styles.primaryButtonText}>{isRunning ? 'Duraklat' : 'Başlat'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { borderColor: theme.buttonSecondaryBorder, backgroundColor: theme.buttonSecondaryBg },
          ]}
          onPress={handleReset}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Sıfırla (Kaydet)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sessionsList} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[styles.sessionsTitle, { color: theme.text }]}>Seans Geçmişi</Text>

        {sessions.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.muted }]}>Henüz kayıtlı seans yok.</Text>
        ) : (
          sessions.map(session => (
            <View key={session.id} style={[styles.sessionCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.sessionText, { color: theme.text }]}>Kategori: {session.category}</Text>
              <Text style={[styles.sessionText, { color: theme.text }]}>Süre: {Math.floor(session.durationSeconds / 60)} dk {session.durationSeconds % 60} sn</Text>
              <Text style={[styles.sessionText, { color: theme.text }]}>Dikkat Dağınıklığı: {session.distractCount ?? 0}</Text>
              <Text style={[styles.sessionText, { color: theme.muted }]}>Tarih: {new Date(session.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
