import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '../src/contexts/AuthContext';
import { getChatInfo, getChatMessages, sendChatMessage } from '../src/services/chat';
import { Colors, Spacing, BorderRadius } from '../src/theme/colors';
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
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessageItem | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const inputRef = useRef<TextInput>(null);

  // Build index map for scroll-to-message
  const messageIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    (messages ?? []).forEach((m, i) => { if (m?.id) map.set(m.id, i); });
    return map;
  }, [messages]);

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

  /* ---- Reply helpers ---- */
  const activateReply = useCallback((msg: ChatMessageItem) => {
    setReplyingTo(msg);
    // Close the swipeable that triggered this
    const ref = swipeableRefs.current.get(msg?.id ?? '');
    ref?.close?.();
    // Focus the input
    setTimeout(() => inputRef.current?.focus?.(), 100);
  }, []);

  const cancelReply = useCallback(() => setReplyingTo(null), []);

  const scrollToMessage = useCallback((targetId: string) => {
    const idx = messageIndexMap.get(targetId);
    if (idx != null && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  }, [messageIndexMap]);

  /* ---- Send ---- */
  const handleSend = async () => {
    const trimmed = text?.trim?.() ?? '';
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const newMsg = await sendChatMessage(chatId, trimmed, 'text', undefined, replyingTo?.id);
      if (newMsg) {
        setMessages((prev) => [newMsg, ...(prev ?? [])]);
      }
      setText('');
      setReplyingTo(null);
    } catch { }
    setSending(false);
  };

  const pickAndSendImage = async (source: 'gallery' | 'camera') => {
    setShowAttachMenu(false);
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm?.granted) {
          Alert.alert('Permiso necesario', 'Necesitas permitir el acceso a la cámara.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm?.granted) {
          Alert.alert('Permiso necesario', 'Necesitas permitir el acceso a la galería.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
        });
      }

      if (result?.canceled || !result?.assets?.[0]) return;

      const asset = result.assets[0];
      const uri = asset?.uri ?? '';
      if (!uri) return;

      const fileName = uri.split('/').pop() ?? `image_${Date.now()}.jpg`;
      const contentType = asset?.mimeType ?? 'image/jpeg';

      setUploading(true);
      const uploadRes = await uploadFileWithUrl(uri, fileName, contentType);
      const imageUrl = uploadRes?.url ?? '';

      if (imageUrl) {
        const newMsg = await sendChatMessage(chatId, '📷 Imagen', 'image', imageUrl, replyingTo?.id);
        if (newMsg) {
          setMessages((prev) => [newMsg, ...(prev ?? [])]);
        }
        setReplyingTo(null);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo enviar la imagen. Intenta de nuevo.');
    }
    setUploading(false);
  };

  /* ---- Swipe right action (reply arrow) ---- */
  const renderLeftActions = useCallback((_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({ inputRange: [0, 60], outputRange: [0.4, 1], extrapolate: 'clamp' });
    return (
      <View style={styles.swipeReplyAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="arrow-undo" size={22} color={Colors.primary} />
        </Animated.View>
      </View>
    );
  }, []);

  /* ---- Render message ---- */
  const renderMessage = useCallback(({ item }: { item: ChatMessageItem }) => {
    return (
      <Swipeable
        ref={(ref) => { if (ref && item?.id) swipeableRefs.current.set(item.id, ref); }}
        renderLeftActions={renderLeftActions}
        onSwipeableOpen={(direction) => { if (direction === 'left') activateReply(item); }}
        leftThreshold={60}
        overshootLeft={false}
        friction={2}
      >
        <ChatMessageComp
          messageText={item?.messageText ?? ''}
          senderName={item?.senderName ?? ''}
          createdAt={item?.createdAt ?? ''}
          isOwn={item?.senderId === user?.id}
          isVendorMessage={item?.senderId === chatInfo?.vendorUserId}
          messageType={item?.messageType}
          imageUrl={item?.imageUrl}
          replyTo={item?.replyTo}
          onReplyPress={scrollToMessage}
        />
      </Swipeable>
    );
  }, [user?.id, chatInfo?.vendorUserId, renderLeftActions, activateReply, scrollToMessage]);

  if (loading) return <LoadingSpinner />;

  const replyPreviewText = replyingTo
    ? ((replyingTo?.messageType ?? 'text') === 'image' ? '📷 Imagen' : (replyingTo?.messageText ?? ''))
    : '';
  const replyPreviewSnippet = replyPreviewText.length > 50 ? replyPreviewText.substring(0, 47) + '...' : replyPreviewText;

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
          ref={flatListRef}
          data={messages ?? []}
          keyExtractor={(item) => item?.id ?? Math.random().toString()}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={<Text style={styles.emptyChat}>No hay mensajes aún. ¡Inicia la conversación!</Text>}
          onScrollToIndexFailed={(info) => {
            // Scroll to approximate position then retry
            flatListRef.current?.scrollToOffset?.({ offset: info.averageItemLength * info.index, animated: true });
          }}
        />

        {/* Uploading indicator */}
        {uploading ? (
          <View style={styles.uploadingBar}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.uploadingText}>Subiendo imagen...</Text>
          </View>
        ) : null}

        {/* Attach menu popover */}
        {showAttachMenu ? (
          <View style={styles.attachMenu}>
            <Pressable style={styles.attachOption} onPress={() => pickAndSendImage('gallery')}>
              <Ionicons name="images" size={24} color={Colors.primary} />
              <Text style={styles.attachOptionText}>Galería</Text>
            </Pressable>
            <Pressable style={styles.attachOption} onPress={() => pickAndSendImage('camera')}>
              <Ionicons name="camera" size={24} color={Colors.primary} />
              <Text style={styles.attachOptionText}>Cámara</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Reply preview bar */}
        {replyingTo ? (
          <View style={styles.replyBar}>
            <View style={styles.replyBarLeft}>
              <View style={styles.replyBarAccent} />
              <View style={styles.replyBarContent}>
                <Text style={styles.replyBarName} numberOfLines={1}>{replyingTo?.senderName ?? ''}</Text>
                <Text style={styles.replyBarText} numberOfLines={1}>{replyPreviewSnippet}</Text>
              </View>
            </View>
            <Pressable onPress={cancelReply} style={styles.replyBarClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.inputBar}>
          <Pressable
            style={styles.attachBtn}
            onPress={() => setShowAttachMenu((v) => !v)}
            disabled={uploading}
          >
            <Ionicons name={showAttachMenu ? 'close' : 'attach'} size={24} color={uploading ? Colors.textSecondary : Colors.primary} />
          </Pressable>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            maxLength={1000}
            onFocus={() => setShowAttachMenu(false)}
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

// Helper that uploads and returns the public URL
async function uploadFileWithUrl(
  uri: string, fileName: string, contentType: string,
): Promise<{ url: string; storagePath: string }> {
  const { getPresignedUrl, completeUpload } = await import('../src/services/upload');
  const presigned = await getPresignedUrl(fileName, contentType, true);
  const uploadUrl = presigned?.uploadUrl ?? '';
  const storagePath = presigned?.cloud_storage_path ?? '';

  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();

  const headers: Record<string, string> = { 'Content-Type': contentType };
  const signedHeaders = new URL(uploadUrl).searchParams?.get?.('X-Amz-SignedHeaders') ?? '';
  if (signedHeaders?.includes?.('content-disposition')) {
    headers['Content-Disposition'] = 'attachment';
  }

  await fetch(uploadUrl, { method: 'PUT', body: blob, headers });
  const result = await completeUpload(storagePath, fileName, contentType);
  return { url: result?.url ?? '', storagePath };
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
  uploadingBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, backgroundColor: Colors.backgroundSection,
  },
  uploadingText: { marginLeft: 8, fontSize: 13, color: Colors.textSecondary },
  attachMenu: {
    flexDirection: 'row', justifyContent: 'space-evenly',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  attachOption: {
    alignItems: 'center', paddingVertical: 8, paddingHorizontal: 24,
  },
  attachOptionText: { fontSize: 12, color: Colors.textPrimary, marginTop: 4 },
  /* Swipe reply action */
  swipeReplyAction: {
    width: 60, justifyContent: 'center', alignItems: 'center',
  },
  /* Reply preview bar */
  replyBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  replyBarLeft: { flexDirection: 'row', alignItems: 'stretch', flex: 1, marginRight: 8 },
  replyBarAccent: { width: 3, backgroundColor: Colors.primary, borderRadius: 2, marginRight: 8 },
  replyBarContent: { flex: 1, justifyContent: 'center' },
  replyBarName: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  replyBarText: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  replyBarClose: { padding: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white,
  },
  attachBtn: {
    width: 40, height: 44, justifyContent: 'center', alignItems: 'center',
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
