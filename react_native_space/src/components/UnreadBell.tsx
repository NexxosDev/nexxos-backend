import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUnread } from '../contexts/UnreadContext';
import { useTheme } from '../contexts/ThemeContext';

export default function UnreadBell() {
  const { totalUnread } = useUnread();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons
        name={totalUnread > 0 ? 'notifications' : 'notifications-outline'}
        size={24}
        color={colors.textPrimary}
      />
      {totalUnread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {totalUnread > 99 ? '99+' : totalUnread}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
