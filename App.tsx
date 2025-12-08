import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const DEFAULT_MINUTES = 25;

type FocusSession = {
  id: string;
  category: string;
  durationSeconds: number;
  createdAt: string;
  distractCount: number;
};

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function HomeScreen() {
  const [workMinutes, setWorkMinutes] = useState(DEFAULT_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [category, setCategory] = useState('Ders');
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [distractions, setDistractions] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const appStateRef = useRef(AppState.currentState);

  // AppState: dikkat dağınıklığı takibi
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prevState = appStateRef.current;

      // aktiften arka plana geçiş → dikkat dağınıklığı
      if (prevState === 'active' && nextState === 'background') {
        if (isRunning) {
          setDistractions(d => d + 1);
          setIsRunning(false);
        }
      }

      // arka plandan tekrar aktive dönüş
      if (prevState === 'background' && nextState === 'active') {
        if (!isRunning && secondsLeft !== workMinutes * 60) {
          setShowResumePrompt(true);
        }
      }

      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, [isRunning, secondsLeft, workMinutes]);

  // Kayıtlı seansları yükle
  useEffect(() => {
    const load = async () => {
      try {
        const json = await AsyncStorage.getItem('sessions');
        if (json) {
          setSessions(JSON.parse(json));
        }
      } catch (e) {
        console.log('loadSessions error', e);
      }
    };
    load();
  }, []);

  // Timer efekti
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

  const changeWorkMinutes = (delta: number) => {
    if (isRunning) return; // çalışırken süre ayarlanmasın
    setWorkMinutes(prev => {
      const next = Math.min(90, Math.max(1, prev + delta));
      setSecondsLeft(next * 60);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      {/* Geri dönünce çıkan popup */}
      <Modal transparent visible={showResumePrompt} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>Devam etmek ister misin?</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={styles.modalYes}
                onPress={() => {
                  setShowResumePrompt(false);
                  setIsRunning(true);
                }}
              >
                <Text style={styles.modalYesText}>Evet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalNo}
                onPress={() => {
                  setShowResumePrompt(false);
                }}
              >
                <Text style={styles.modalNoText}>Hayır</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={styles.title}>Odaklanma Zamanlayıcısı</Text>

      <View style={{ marginBottom: 16 }}>
        <Picker
          selectedValue={category}
          onValueChange={v => setCategory(v)}
          style={{ width: 250, height: 50, color: 'white' }}
          dropdownIconColor="white"
        >
          <Picker.Item label="Ders" value="Ders" />
          <Picker.Item label="İş" value="İş" />
          <Picker.Item label="Proje" value="Proje" />
          <Picker.Item label="Sınav" value="Sınav" />
          <Picker.Item label="Kişisel" value="Kişisel" />
        </Picker>
      </View>

      <Text style={{ color: '#9ca3af', marginBottom: 8 }}>
        Seçilen kategori: {category}
      </Text>

      {/* Büyük sayaç + küçük +/- butonlar */}
      <View style={styles.timerRow}>
        <TouchableOpacity
          style={styles.smallAdjustButton}
          onPress={() => changeWorkMinutes(-1)}
        >
          <Text style={styles.smallAdjustText}>−</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>
          <Text style={styles.smallMinutesLabel}>{workMinutes} dk</Text>
        </View>

        <TouchableOpacity
          style={styles.smallAdjustButton}
          onPress={() => changeWorkMinutes(1)}
        >
          <Text style={styles.smallAdjustText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.distractionText}>
        Dikkat Dağınıklığı: {distractions}
      </Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleStartPause}
        >
          <Text style={styles.primaryButtonText}>
            {isRunning ? 'Durdur' : 'Başlat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Sıfırla (Kaydet)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.sessionsList}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.sessionsTitle}>Seans Geçmişi</Text>

        {sessions.length === 0 ? (
          <Text style={styles.emptyText}>Henüz kayıtlı seans yok.</Text>
        ) : (
          sessions.map(session => (
            <View key={session.id} style={styles.sessionCard}>
              <Text style={styles.sessionText}>
                Kategori: {session.category}
              </Text>
              <Text style={styles.sessionText}>
                Süre:{' '}
                {Math.floor(session.durationSeconds / 60)} dk{' '}
                {session.durationSeconds % 60} sn
              </Text>
              <Text style={styles.sessionText}>
                Dikkat Dağınıklığı: {session.distractCount ?? 0}
              </Text>
              <Text style={styles.sessionText}>
                Tarih:{' '}
                {new Date(session.createdAt).toLocaleString('tr-TR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function ReportsScreen() {
  return (
    <View style={styles.reportsContainer}>
      <Text style={styles.title}>Raporlar</Text>
      <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
        Toplam süre, kategori bazlı dağılım ve dikkat dağınıklığı istatistikleri
        burada gösterilecek.
      </Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#050816',
            borderTopColor: '#111827',
          },
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#9ca3af',
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Zamanlayıcı' }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{ title: 'Raporlar' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    backgroundColor: '#050816',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  timer: {
    fontSize: 64,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 4,
    textAlign: 'center',
  },
  smallMinutesLabel: {
    marginTop: 4,
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  smallAdjustButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAdjustText: {
    color: '#9ca3af',
    fontSize: 20,
    fontWeight: '600',
    marginTop: -2,
  },
  distractionText: {
    textAlign: 'center',
    color: '#22c55e',
    marginBottom: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'black',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    borderColor: '#6b7280',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 999,
    minWidth: 140,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  sessionsList: {
    marginTop: 24,
  },
  sessionsTitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
  },
  sessionCard: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  sessionText: {
    color: 'white',
    fontSize: 13,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  reportsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    backgroundColor: '#050816',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#0f172a',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalYes: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#22c55e',
    borderRadius: 8,
  },
  modalYesText: {
    color: 'black',
    fontWeight: '700',
  },
  modalNo: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  modalNoText: {
    color: 'white',
  },
});
