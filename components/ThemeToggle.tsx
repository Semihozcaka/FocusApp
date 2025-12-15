import React, { useContext } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import ThemeContext from '../context/ThemeContext';
import styles from '../styles/styles';

export default function ThemeToggle() {
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
