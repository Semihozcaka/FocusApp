import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, Dimensions, PanResponder } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import ThemeContext, { DarkTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { rgbaFromHex } from '../utils/helpers';
import styles from '../styles/styles';

type FocusSession = {
  id: string;
  category: string;
  durationSeconds: number;
  createdAt: string;
  distractCount: number;
};

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const themeContext = React.useContext(ThemeContext);
  const theme = themeContext?.theme || DarkTheme;
  const isDark = themeContext?.isDark || true;
  const navigation = useNavigation<any>();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dy) < 20,
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
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const isToday = (iso: string) => isSameDay(new Date(iso), now);

  const todaySessions = sessions.filter(s => isToday(s.createdAt));

  const todaySeconds = todaySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
  const totalDistractions = sessions.reduce((sum, s) => sum + (s.distractCount ?? 0), 0);

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
    datasets: [{ data: last7Days.map(d => (Number.isFinite(d.minutes) ? d.minutes : 0)) }],
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
