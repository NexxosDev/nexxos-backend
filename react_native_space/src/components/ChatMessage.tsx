import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../theme/colors';

interface ChatMessageProps {
  messageText: string;
  senderName: string;
  createdAt: string;
  isOwn: boolean;
  isVendorMessage?: boolean;
}

export default function ChatMessage({ messageText, senderName, createdAt, isOwn, isVendorMessage = false }: ChatMessageProps) {
  const formatTime = (d: string) => {
    try {
      const date = new Date(d);
      return date?.toLocaleTimeString?.('es-VE', { hour: '2-digit', minute: '2-digit' }) ?? '';
    } catch { return ''; }
  };

  // Vendedor: burbujas amarillas a la derecha
  // Cliente: burbujas blancas a la izquierda
  const shouldBeYellow = isVendorMessage;
  const shouldBeOnRight = isVendorMessage;

  return (
    <View style={[styles.row, shouldBeOnRight ? styles.rowOwn : styles.rowOther]}>
      <View style={[styles.bubble, shouldBeYellow ? styles.bubbleVendor : styles.bubbleClient]}>
        {!isOwn ? <Text style={styles.sender}>{senderName ?? ''}</Text> : null}
        <Text style={[styles.text, shouldBeYellow ? styles.textVendor : styles.textClient]}>{messageText ?? ''}</Text>
        <Text style={[styles.time, shouldBeYellow ? styles.timeVendor : styles.timeClient]}>{formatTime(createdAt ?? '')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: Spacing.sm, paddingHorizontal: Spacing.md },
  rowOwn: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', padding: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg },
  bubbleVendor: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleClient: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  sender: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 2 },
  text: { fontSize: 15, lineHeight: 20 },
  textVendor: { color: Colors.accent },
  textClient: { color: Colors.textPrimary },
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timeVendor: { color: 'rgba(0,0,0,0.5)' },
  timeClient: { color: Colors.textSecondary },
});
