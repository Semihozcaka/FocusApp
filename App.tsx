import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
//gün2 katagori
const WORK_MINUTES = 25;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function App() {
  const [secondsLeft, setSecondsLeft] = useState(WORK_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [category, setCategory] = useState("Ders");

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  const handleStartPause = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(WORK_MINUTES * 60);
    }
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(WORK_MINUTES * 60);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Odaklanma Zamanlayıcısı</Text>
      <Text style={styles.subtitle}>25 dakikalık çalışma seansı</Text>
      <View style={{ marginBottom: 20 }}>
      
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
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
        <TouchableOpacity style={styles.primaryButton} onPress={handleStartPause}>
          <Text style={styles.primaryButtonText}>
            {isRunning ? 'Durdur' : secondsLeft === 0 ? 'Yeniden Başlat' : 'Başlat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Sıfırla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    backgroundColor: '#050816',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 40,
  },
  timer: {
    fontSize: 64,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 4,
    marginBottom: 40,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 16,
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
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 100,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
