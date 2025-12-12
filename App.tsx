import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  AppState,
  RefreshControl,
  Dimensions,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import {
  NavigationContainer,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BarChart, PieChart } from 'react-native-chart-kit';

const DEFAULT_MINUTES = 25;
const screenWidth = Dimensions.get('window').width;

/* ------------------------------- Theme ------------------------------- */

type Theme = {
  background: string;
  card: string;
  text: string;
  muted: string;
  accent: string;
  tabBar: string;
  border: string;
  buttonSecondaryBg: string;
  buttonSecondaryBorder: string;
};

const DarkTheme: Theme = {
  background: '#050816',
  card: '#0f172a',
  text: '#f9fafb',
  muted: '#9ca3af',
  accent: '#22c55e',
  tabBar: '#050816',
  border: '#111827',
  buttonSecondaryBg: 'transparent',
  buttonSecondaryBorder: '#6b7280',
};

const LightTheme: Theme = {
  background: '#f9fafb',
  card: '#e5e7eb',
  text: '#020617',
  muted: '#4b5563',
  accent: '#f97316',
  tabBar: '#f3f4f6',
  border: '#e5e7eb',
  buttonSecondaryBg: 'transparent',
  buttonSecondaryBorder: '#9ca3af',
};

const ThemeContext = React.createContext<{
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}>({
  theme: DarkTheme,
  isDark: true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toggleTheme: () => {},
});

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

/* ------------------------- Küçük tema switcher ------------------------ */

function ThemeToggle() {
  const { isDark, toggleTheme } = useContext(ThemeContext);

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.themeToggle,
        { backgroundColor: isDark ? '#020617' : '#f97316' },
      ]}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.themeToggleThumb,
          { alignSelf: isDark ? 'flex-end' : 'flex-start' },
        ]}
      >
        <Text style={styles.themeToggleIcon}>{isDark ? '🌙' : '☀️'}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* -------------------------------- Home -------------------------------- */

function HomeScreen() {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation<any>();

  const [workMinutes, setWorkMinutes] = useState(DEFAULT_MINUTES);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [category, setCategory] = useState('Ders');
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [distractions, setDistractions] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const appStateRef = useRef(AppState.currentState);

  // Swipe: sola kaydır → Reports
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dy) < 20,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) navigation.navigate('Reports');
      },
    }),
  ).current;

  // AppState: dikkat dağınıklığı
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

  // Seans yükle
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
            <Text style={[styles.modalText, { color: theme.text }]}>
              Devam etmek ister misin?
            </Text>
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
                style={[
                  styles.modalNo,
                  { borderColor: theme.buttonSecondaryBorder },
                ]}
                onPress={() => setShowResumePrompt(false)}
              >
                <Text style={[styles.modalNoText, { color: theme.text }]}>
                  Hayır
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header + toggle */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>
          FocusApp
        </Text>
        <ThemeToggle />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Picker
          selectedValue={category}
          onValueChange={v => setCategory(v)}
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

      <Text style={{ color: theme.muted, marginBottom: 8 }}>
        Seçilen kategori: {category}
      </Text>

      <View style={styles.timerRow}>
        <TouchableOpacity
          style={[
            styles.smallAdjustButton,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => changeWorkMinutes(-1)}
        >
          <Text style={[styles.smallAdjustText, { color: theme.text }]}>−</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.timer, { color: theme.text }]}>
            {formatTime(secondsLeft)}
          </Text>
          <Text style={[styles.smallMinutesLabel, { color: theme.muted }]}>
            {workMinutes} dk
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.smallAdjustButton,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => changeWorkMinutes(1)}
        >
          <Text style={[styles.smallAdjustText, { color: theme.text }]}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.distractionText, { color: theme.accent }]}>
        Dikkat Dağınıklığı: {distractions}
      </Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          onPress={handleStartPause}
        >
          <Text style={styles.primaryButtonText}>
            {isRunning ? 'Durdur' : 'Başlat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            {
              borderColor: theme.buttonSecondaryBorder,
              backgroundColor: theme.buttonSecondaryBg,
            },
          ]}
          onPress={handleReset}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
            Sıfırla (Kaydet)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.sessionsList}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={[styles.sessionsTitle, { color: theme.text }]}>
          Seans Geçmişi
        </Text>

        {sessions.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            Henüz kayıtlı seans yok.
          </Text>
        ) : (
          sessions.map(session => (
            <View
              key={session.id}
              style={[styles.sessionCard, { backgroundColor: theme.card }]}
            >
              <Text style={[styles.sessionText, { color: theme.text }]}>
                Kategori: {session.category}
              </Text>
              <Text style={[styles.sessionText, { color: theme.text }]}>
                Süre: {Math.floor(session.durationSeconds / 60)} dk{' '}
                {session.durationSeconds % 60} sn
              </Text>
              <Text style={[styles.sessionText, { color: theme.text }]}>
                Dikkat Dağınıklığı: {session.distractCount ?? 0}
              </Text>
              <Text style={[styles.sessionText, { color: theme.muted }]}>
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

/* ------------------------------- Reports ------------------------------- */

function ReportsScreen() {
  const { theme, isDark } = useContext(ThemeContext);
  const navigation = useNavigation<any>();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  // Swipe: sağa kaydır → Home
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 20 && Math.abs(g.dy) < 20,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 50) navigation.navigate('Home');
      },
    }),
  ).current;

  const loadSessions = async () => {
    try {
      const json = await AsyncStorage.getItem('sessions');
      if (json) setSessions(JSON.parse(json));
      else setSessions([]);
    } catch (e) {
      console.log('reports load error', e);
    }
  };

  useEffect(() => {
    if (isFocused) loadSessions();
  }, [isFocused]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const now = new Date();

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isToday = (iso: string) => isSameDay(new Date(iso), now);

  const todaySessions = sessions.filter(s => isToday(s.createdAt));

  const todaySeconds = todaySessions.reduce(
    (sum, s) => sum + (s.durationSeconds || 0),
    0,
  );
  const totalSeconds = sessions.reduce(
    (sum, s) => sum + (s.durationSeconds || 0),
    0,
  );
  const totalDistractions = sessions.reduce(
    (sum, s) => sum + (s.distractCount ?? 0),
    0,
  );

  const todayMinutes = Math.floor(todaySeconds / 60);
  const totalMinutes = Math.floor(totalSeconds / 60);

  const weekdayShort = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const last7Days = Array.from({ length: 7 }).map((_, index) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - index));
    const label = weekdayShort[d.getDay()];

    const dayTotalSeconds = sessions.reduce((sum, s) => {
      const sd = new Date(s.createdAt);
      return isSameDay(sd, d) ? sum + (s.durationSeconds || 0) : sum;
    }, 0);

    return { label, minutes: Math.round(dayTotalSeconds / 60) };
  });

  const barData = {
    labels: last7Days.map(d => d.label),
    datasets: [{ data: last7Days.map(d => d.minutes) }],
  };

  const categoryTotals: Record<string, number> = {};
  sessions.forEach(s => {
    const key = s.category || 'Diğer';
    categoryTotals[key] = (categoryTotals[key] || 0) + (s.durationSeconds || 0);
  });

  const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#e11d48', '#14b8a6'];

  const pieEntries = Object.entries(categoryTotals).filter(([, seconds]) => seconds > 0);

  const pieData = pieEntries.map(([cat, seconds], idx) => ({
    name: cat,
    population: seconds,
    color: colors[idx % colors.length],
    legendFontColor: isDark ? '#e5e7eb' : '#111827',
    legendFontSize: 13,
  }));

  // chart-kit için light modda arka planı açıyoruz
  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      // bar rengi (accent)
      const a = theme.accent;
      // accent hex -> rgba basit yaklaşım: dark/light’ta zaten net; opaklık sadece label için kullanılıyor
      return `rgba(34, 197, 94, ${opacity})`;
    },
    labelColor: (opacity = 1) =>
      isDark
        ? `rgba(209, 213, 219, ${opacity})`
        : `rgba(17, 24, 39, ${opacity})`,
    propsForBackgroundLines: {
      stroke: isDark ? '#1f2937' : '#cbd5e1',
    },
    barPercentage: 0.55,
  };

  return (
    <ScrollView
      style={[styles.reportsContainer, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.accent}
          colors={[theme.accent]}
          progressBackgroundColor={theme.background}
        />
      }
      {...panResponder.panHandlers}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Raporlar</Text>
        <ThemeToggle />
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.muted }]}>
            Bugün Toplam Odaklanma Süresi
          </Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {todayMinutes} dk
          </Text>
          <Text style={[styles.statSubLabel, { color: theme.muted }]}>
            ({todaySeconds} sn)
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.muted }]}>
            Tüm Zamanların Toplam Süresi
          </Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {totalMinutes} dk
          </Text>
          <Text style={[styles.statSubLabel, { color: theme.muted }]}>
            ({totalSeconds} sn)
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.muted }]}>
            Toplam Dikkat Dağınıklığı
          </Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {totalDistractions}
          </Text>
        </View>
      </View>

      <Text style={[styles.chartTitle, { color: theme.text }]}>
        Son 7 Günlük Odaklanma Süresi
      </Text>

      {totalSeconds === 0 ? (
        <Text style={[styles.emptyText, { color: theme.muted }]}>
          Grafik için henüz kayıtlı seans yok.
        </Text>
      ) : (
        <BarChart
          data={barData}
          width={screenWidth - 48}
          height={220}
          chartConfig={chartConfig}
          style={[styles.chart, { backgroundColor: theme.card }]}
          fromZero
          showValuesOnTopOfBars
        />
      )}

      <Text style={[styles.chartTitle, { color: theme.text }]}>
        Kategori Bazlı Dağılım
      </Text>

      {pieData.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.muted }]}>
          Kategori grafiği için henüz veri yok.
        </Text>
      ) : (
        <PieChart
          data={pieData}
          width={screenWidth - 48}
          height={220}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="16"
          chartConfig={chartConfig}
          hasLegend
        />
      )}
    </ScrollView>
  );
}

/* ------------------------------- Navigator ------------------------------ */

const Tab = createBottomTabNavigator();

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const theme = isDark ? DarkTheme : LightTheme;
  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.tabBar,
              borderTopColor: theme.border,
            },
            tabBarActiveTintColor: theme.accent,
            tabBarInactiveTintColor: theme.muted,
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
    </ThemeContext.Provider>
  );
}

/* -------------------------------- Styles -------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    flexShrink: 1,
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
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  smallMinutesLabel: {
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
  },
  smallAdjustButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAdjustText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
  distractionText: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'black',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 999,
    minWidth: 140,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 12,
  },
  sessionsList: {
    marginTop: 24,
  },
  sessionsTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '800',
  },
  sessionCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sessionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reportsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  statsContainer: {
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    borderRadius: 14,
    padding: 14,
  },
  statLabel: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  statSubLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  chartTitle: {
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
    fontWeight: '900',
  },
  chart: {
    borderRadius: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '800',
  },
  modalYes: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalYesText: {
    color: 'black',
    fontWeight: '900',
  },
  modalNo: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalNoText: {
    fontWeight: '800',
  },
  themeToggle: {
    width: 46,
    height: 24,
    borderRadius: 999,
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  themeToggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeToggleIcon: {
    fontSize: 12,
  },
});
