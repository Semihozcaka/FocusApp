import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, Dimensions, PanResponder } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import ThemeContext, { DarkTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { rgbaFromHex } from '../utils/helpers';
import styles from '../styles/styles';
 
// Raporlar ekranı: kayıtlı oturumları okuyup grafik ve istatistik gösterir.
 
type FocusSession = {
  id: string;
  category: string;
  durationSeconds: number;
  createdAt: string;
  distractCount: number;
};

const screenWidth = Dimensions.get('window').width;

// Ekran genişliğini alıp grafik genişlik hesaplamaları için kullanılır.

export default function ReportsScreen() {
  // Tema bağlamından güncel tema bilgilerini alır.
  const themeContext = React.useContext(ThemeContext);
  const theme = themeContext?.theme || DarkTheme;
  const isDark = themeContext?.isDark || true;
  const navigation = useNavigation<any>();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  // Kaydırma jestini dinleyerek soldan sağa kaydırma ile Ana sayfaya döner.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dy) < 20,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 50) navigation.navigate('Home');
      },
    }),
  ).current;

  // AsyncStorage'dan kaydedilmiş oturum verilerini yükler.
  const loadSessions = async () => {
    try {
      const json = await AsyncStorage.getItem('sessions');
      if (json) setSessions(JSON.parse(json));
      else setSessions([]);
    } catch (e) {
      console.log('reports load error', e);
    }
  };

  // Ekran görünür olduğunda oturum verilerini yeniden yükler.
  useEffect(() => {
    if (isFocused) loadSessions();
  }, [isFocused]);

  // Pull-to-refresh ile verileri yeniler.
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  // Şu anki tarih ve gün karşılaştırma yardımcı fonksiyonları.
  const now = new Date();

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  // Bir ISO tarihinin bugün olup olmadığını kontrol eder.
  const isToday = (iso: string) => isSameDay(new Date(iso), now);

  // Bugün ve tüm zamanlar için toplam süre ve dikkat dağınıklığı hesaplamaları.
  const todaySessions = sessions.filter(s => isToday(s.createdAt));

  const todaySeconds = todaySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const totalDistractions = sessions.reduce((sum, s) => sum + (s.distractCount ?? 0), 0);

  const todayMinutes = Math.floor(todaySeconds / 60);
  const totalMinutes = Math.floor(totalSeconds / 60);

  const weekdayShort = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  // Son 7 gün için etiket ve günlük toplam dakika verisini hazırlar.
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
    datasets: [{ data: last7Days.map(d => (Number.isFinite(d.minutes) ? d.minutes : 0)) }],
  };

  // Çubuk grafik için gereken veri yapısı.

  // Kategori bazında toplam süreleri hesaplar.
  const categoryTotals: Record<string, number> = {};
  sessions.forEach(s => {
    const key = s.category || 'Diğer';
    categoryTotals[key] = (categoryTotals[key] || 0) + (s.durationSeconds || 0);
  });

  const colors = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#e11d48', '#14b8a6'];

  const pieEntries = Object.entries(categoryTotals).filter(([, seconds]) => seconds > 0);

  // Pasta grafik için kategorilere göre veri dizisi oluşturur.
  const pieData = pieEntries.map(([cat, seconds], idx) => ({
    name: cat,
    population: seconds,
    color: colors[idx % colors.length],
    legendFontColor: isDark ? '#e5e7eb' : '#111827',
    legendFontSize: 13,
  }));

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: (opacity = 1) => rgbaFromHex(theme.accent, opacity),
    labelColor: (opacity = 1) =>
      isDark ? `rgba(209, 213, 219, ${opacity})` : `rgba(17, 24, 39, ${opacity})`,
    propsForBackgroundLines: {
      stroke: isDark ? '#1f2937' : '#cbd5e1',
    },
    barPercentage: 0.55,
  };

  // Grafiklerin renk, etiket ve görünüm ayarlarını içerir.

  // UI: İstatistik kartları, çubuk grafik ve pasta grafiğini render eder.
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
        <Text style={[styles.title, { color: theme.text }]}>FocusApp</Text>
        <ThemeToggle />
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}> 
          <Text style={[styles.statLabel, { color: theme.muted }]}>Bugün Toplam Odaklanma Süresi</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{todayMinutes} dk</Text>
          <Text style={[styles.statSubLabel, { color: theme.muted }]}>{todaySeconds} sn</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Tüm Zamanların Toplam Süresi</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{totalMinutes} dk</Text>
          <Text style={[styles.statSubLabel, { color: theme.muted }]}>{totalSeconds} sn</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Toplam Dikkat Dağınıklığı</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{totalDistractions}</Text>
        </View>
      </View>

      <Text style={[styles.chartTitle, { color: theme.text }]}>Son 7 Günlük Odaklanma Süresi</Text>

      {totalSeconds === 0 ? (
        <Text style={[styles.emptyText, { color: theme.muted }]}>Grafik için henüz kayıtlı seans yok.</Text>
      ) : React.createElement(BarChart as any, {
        data: barData,
        width: screenWidth - 48,
        height: 220,
        chartConfig: chartConfig,
        fromZero: true,
        showValuesOnTopOfBars: true,
      })}

      <Text style={[styles.chartTitle, { color: theme.text }]}>Kategori Bazlı Dağılım</Text>

      {pieData.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.muted }]}>Kategori grafiği için henüz veri yok.</Text>
      ) : (
        <PieChart data={pieData} width={screenWidth - 48} height={220} accessor="population" backgroundColor="transparent" paddingLeft="16" chartConfig={chartConfig} hasLegend />
      )}
    </ScrollView>
  );
}
