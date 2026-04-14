import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { getChatInfo, getChatMessages, sendChatMessage } from '../src/services/chat';
import { Colors, Spacing } from '../src/theme/colors';
import ChatMessageComp from '../src/components/ChatMessage';
import LoadingSpinner from '../src/components/LoadingSpinner';
import type { ChatInfo, ChatMessageItem } from '../src/types';

export default function ChatScreen() {
  const router = useRouter();
  const { chatId = '' } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const data = await getChatMessages(chatId, { limit: 50 });
      setMessages(data?.items ?? []);
    } catch { }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    (async () => {
      try {
        const [info] = await Promise.all([getChatInfo(chatId), fetchMessages()]);
        setChatInfo(info ?? null);
      } catch { }
      setLoading(false);
    })();
  }, [chatId]);

  useEffect(() => {
    intervalRef.current = setInterval(fetchMessages, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchMessages]);

  const handleSend = async () => {
    const trimmed = text?.trim?.() ?? '';
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const newMsg = await sendChatMessage(chatId, trimmed);
      if (newMsg) {
        setMessages((prev) => [newMsg, ...(prev ?? [])]);
      }
      setText('');
    } catch { }
    setSending(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{chatInfo?.otherUserName ?? 'Chat'}</Text>
          <Text style={styles.headerSummary} numberOfLines={1}>{chatInfo?.requestSummary ?? ''}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          data={messages ?? []}
          keyExtractor={(item) => item?.id ?? Math.random().toString()}
          renderItem={({ item }) => (
            <ChatMessageComp
              messageText={item?.messageText ?? ''}
              senderName={item?.senderName ?? ''}
              createdAt={item?.createdAt ?? ''}
              isOwn={item?.senderId === user?.id}
              isVendorMessage={item?.senderId === chatInfo?.vendorUserId}
            />
          )}
          inverted
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={<Text style={styles.emptyChat}>No hay mensajes aún. ¡Inicia la conversación!</Text>}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[styles.sendBtn, (!text?.trim?.() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text?.trim?.() || sending}
          >
            <Ionicons name="send" size={20} color={text?.trim?.() ? Colors.accent : Colors.textSecondary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: 4 },
  headerName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  headerSummary: { fontSize: 12, color: Colors.textSecondary },
  messageList: { padding: Spacing.sm, paddingBottom: Spacing.md },
  emptyChat: { textAlign: 'center', color: Colors.textSecondary, padding: Spacing.xl },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 20,
    paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 15,
    color: Colors.textPrimary, maxHeight: 100, backgroundColor: Colors.backgroundSection,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginLeft: Spacing.sm,
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
});
