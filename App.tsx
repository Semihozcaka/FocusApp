import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import HomeScreen from './screens/HomeScreen';
import ReportsScreen from './screens/ReportsScreen';

const Tab = createBottomTabNavigator();

function NavigatorContent() {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) return null;
  const { theme } = themeContext;

  return (
    <NavigationContainer>
      <Tab.Navigator
        id="bottom-tabs"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.tabBar,
            borderTopColor: theme.border,
          },
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.muted,
          tabBarIcon: ({ color, size }) => {
            const iconName =
              route.name === 'Home' ? 'timer-outline' : 'stats-chart-outline';
            return (
              <Ionicons name={iconName as any} size={size} color={color} />
            );
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Sayaç' }}
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

export default function App() {
  return (
    <ThemeProvider>
      <NavigatorContent />
    </ThemeProvider>
  );
}
