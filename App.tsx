import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const WORK_MINUTES = 25;

type FocusSession = {
  id: string;
  category: string;
  durationSeconds: number;
  createdAt: string;
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function App() {
  const [secondsLeft, setSecondsLeft] = useState(WORK_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [category, setCategory] = useState('Ders');
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  // Uygulama açıldığında eski seansları yükle
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const json = await AsyncStorage.getItem('sessions');
      if (json) {
        setSessions(JSON.parse(json));
      }
    } catch (e) {
      console.log('Session load error:', e);
    }
  };

  // Zamanlayıcı
  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          // süre bittiğinde seansı kaydet
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
      // bittiyse tekrar başlatmadan önce resetle
      setSecondsLeft(WORK_MINUTES * 60);
    }
    setIsRunning(prev => !prev);
  };

  const handleReset = async () => {
    // Kullanıcı süreyi sıfırlıyorsa ve sayaç tam dolu değilse seansı kaydedelim
    if (secondsLeft !== WORK_MINUTES * 60) {
      await saveCurrentSession(secondsLeft);
    }
    setIsRunning(false);
    setSecondsLeft(WORK_MINUTES * 60);
  };

  const saveCurrentSession = async (currentSecondsLeft: number) => {
    try {
      const durationSeconds = WORK_MINUTES * 60 - currentSecondsLeft;
      if (durationSeconds <= 0) return;

      const newSession: FocusSession = {
        id: Date.now().toString(),
        category,
        durationSeconds,
        createdAt: new Date().toISOString(),
      };

      const updated = [...sessions, newSession];
      setSessions(updated);
      await AsyncStorage.setItem('sessions', JSON.stringify(updated));
    } catch (e) {
      console.log('Session save error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Odaklanma Zamanlayıcısı</Text>
      <Text style={styles.subtitle}>25 dakikalık çalışma seansı</Text>

      <View style={{ marginBottom: 20 }}>
        <Picker
          selectedValue={category}
          onValueChange={itemValue => setCategory(itemValue)}
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

      <Text style={{ color: '#9ca3af', marginBottom: 10 }}>
        Seçilen kategori: {category}
      </Text>

      <Text style={styles.timer}>{formatTime(secondsLeft)}</Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleStartPause}
        >
          <Text style={styles.primaryButtonText}>
            {isRunning
              ? 'Durdur'
              : secondsLeft === 0
              ? 'Yeniden Başlat'
              : 'Başlat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Sıfırla (ve Kaydet)</Text>
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
                Süre: {Math.floor(session.durationSeconds / 60)} dakika {session.durationSeconds % 60} saniye
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
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
    textAlign: 'center',
  },
  timer: {
    fontSize: 64,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 4,
    marginBottom: 20,
    textAlign: 'center',
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
    marginTop: 30,
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
});
