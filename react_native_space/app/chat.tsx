import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Animated, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useUnread } from '../src/contexts/UnreadContext';
import {
  getChatInfo, getChatMessages, sendChatMessage,
  editChatMessage, deleteChatMessage,
  markMessagesDelivered, markMessagesRead,
} from '../src/services/chat';
import { dismissNotificationsForContext, setActiveChatId, clearActiveChatId } from '../src/services/pushNotifications';
import { Spacing, BorderRadius } from '../src/theme/colors';
import type { ThemeColors } from '../src/theme/colors';
import ChatMessageComp from '../src/components/ChatMessage';
import LoadingSpinner from '../src/components/LoadingSpinner';
import type { ChatInfo, ChatMessageItem } from '../src/types';

export default function ChatScreen() {
  const router = useRouter();
  const { chatId = '', readOnly: readOnlyParam = '' } = useLocalSearchParams<{ chatId: string; readOnly?: string }>();
  const isReadOnly = readOnlyParam === '1';
  const { user } = useAuth();
  const { colors } = useTheme();
  const { refresh: refreshUnread } = useUnread();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessageItem | null>(null);

  // Edit mode
  const [editingMessage, setEditingMessage] = useState<ChatMessageItem | null>(null);
  // Context menu
  const [contextMenuMsg, setContextMenuMsg] = useState<ChatMessageItem | null>(null);
  // Delete confirmation
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<ChatMessageItem | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const inputRef = useRef<TextInput>(null);
  const hasMarkedReadRef = useRef(false);

  const messageIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    (messages ?? []).forEach((m, i) => { if (m?.id) map.set(m.id, i); });
    return map;
  }, [messages]);

  // ---------- Data fetching ----------
  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const data = await getChatMessages(chatId, { limit: 50 });
      setMessages(data?.items ?? []);
    } catch { }
  }, [chatId]);

  const markAsDeliveredAndRead = useCallback(async () => {
    if (!chatId) return;
    try {
      await markMessagesDelivered(chatId);
      const result = await markMessagesRead(chatId);
      if ((result?.updated ?? 0) > 0) refreshUnread();
    } catch { }
  }, [chatId, refreshUnread]);

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
    if (!loading && chatId && !hasMarkedReadRef.current) {
      hasMarkedReadRef.current = true;
      markAsDeliveredAndRead();
      dismissNotificationsForContext({ chatId });
    }
  }, [loading, chatId, markAsDeliveredAndRead]);

  // Suppress push notifications while this chat is open (WhatsApp-style)
  useEffect(() => {
    if (chatId) setActiveChatId(chatId);
    return () => { clearActiveChatId(); };
  }, [chatId]);

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      await fetchMessages();
      await markAsDeliveredAndRead();
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchMessages, markAsDeliveredAndRead]);

  // ---------- Reply ----------
  const activateReply = useCallback((msg: ChatMessageItem) => {
    setReplyingTo(msg);
    const ref = swipeableRefs.current.get(msg?.id ?? '');
    ref?.close?.();
    setTimeout(() => inputRef.current?.focus?.(), 100);
  }, []);
  const cancelReply = useCallback(() => setReplyingTo(null), []);

  const scrollToMessage = useCallback((targetId: string) => {
    const idx = messageIndexMap.get(targetId);
    if (idx != null && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  }, [messageIndexMap]);

  // ---------- Send / Edit ----------
  const handleSend = async () => {
    const trimmed = text?.trim?.() ?? '';
    if (!trimmed || sending) return;
    setSending(true);

    if (editingMessage) {
      try {
        const updated = await editChatMessage(chatId, editingMessage.id, trimmed);
        if (updated) {
          setMessages((prev) => (prev ?? []).map((m) => m?.id === updated.id ? updated : m));
        }
      } catch {
        Alert.alert('Error', 'No se pudo editar el mensaje.');
      }
      setEditingMessage(null);
      setText('');
    } else {
      // Optimistic send
      const tempId = `temp_${Date.now()}`;
      const optimistic: ChatMessageItem = {
        id: tempId,
        senderId: user?.id ?? '',
        senderName: '',
        messageText: trimmed,
        messageType: 'text',
        status: 'sending',
        isEdited: false,
        deletedForAll: false,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          messageText: replyingTo.messageType === 'image' ? 'Imagen' : (replyingTo.messageText ?? ''),
          senderName: replyingTo.senderName ?? '',
        } : null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [optimistic, ...(prev ?? [])]);
      setText('');
      setReplyingTo(null);

      try {
        const newMsg = await sendChatMessage(chatId, trimmed, 'text', undefined, replyingTo?.id);
        if (newMsg) {
          setMessages((prev) => (prev ?? []).map((m) => m?.id === tempId ? { ...newMsg, status: newMsg.status ?? 'sent' } : m));
        }
      } catch {
        setMessages((prev) => (prev ?? []).filter((m) => m?.id !== tempId));
        Alert.alert('Error', 'No se pudo enviar el mensaje.');
      }
    }
    setSending(false);
  };

  // ---------- Image upload ----------
  const pickAndSendImage = async (source: 'gallery' | 'camera') => {
    setShowAttachMenu(false);
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm?.granted) { Alert.alert('Permiso necesario', 'Necesitas permitir el acceso a la cámara.'); return; }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm?.granted) { Alert.alert('Permiso necesario', 'Necesitas permitir el acceso a la galería.'); return; }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
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
        const newMsg = await sendChatMessage(chatId, 'Imagen', 'image', imageUrl, replyingTo?.id);
        if (newMsg) { setMessages((prev) => [newMsg, ...(prev ?? [])]); }
        setReplyingTo(null);
      }
    } catch { Alert.alert('Error', 'No se pudo enviar la imagen. Intenta de nuevo.'); }
    setUploading(false);
  };

  // ---------- Context menu ----------
  const openContextMenu = useCallback((msg: ChatMessageItem) => {
    setContextMenuMsg(msg);
  }, []);

  const handleEdit = useCallback(() => {
    if (!contextMenuMsg) return;
    setEditingMessage(contextMenuMsg);
    setText(contextMenuMsg.messageText ?? '');
    setContextMenuMsg(null);
    setTimeout(() => inputRef.current?.focus?.(), 100);
  }, [contextMenuMsg]);

  const cancelEdit = useCallback(() => {
    setEditingMessage(null);
    setText('');
  }, []);

  const handleDeletePrompt = useCallback(() => {
    setDeleteConfirmMsg(contextMenuMsg);
    setContextMenuMsg(null);
  }, [contextMenuMsg]);

  const handleDeleteForAll = useCallback(async () => {
    if (!deleteConfirmMsg) return;
    try {
      const updated = await deleteChatMessage(chatId, deleteConfirmMsg.id);
      if (updated) {
        setMessages((prev) => (prev ?? []).map((m) => m?.id === updated.id ? updated : m));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'No se pudo eliminar el mensaje.';
      Alert.alert('Error', msg);
    }
    setDeleteConfirmMsg(null);
  }, [chatId, deleteConfirmMsg]);

  // ---------- Render ----------
  const renderLeftActions = useCallback((_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({ inputRange: [0, 60], outputRange: [0.4, 1], extrapolate: 'clamp' });
    return (
      <View style={styles.swipeReplyAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="arrow-undo" size={22} color={colors.primary} />
        </Animated.View>
      </View>
    );
  }, [colors.primary, styles.swipeReplyAction]);

  const renderMessage = useCallback(({ item }: { item: ChatMessageItem }) => {
    const isOwn = item?.senderId === user?.id;
    return (
      <Swipeable
        ref={(ref) => { if (ref && item?.id) swipeableRefs.current.set(item.id, ref); }}
        renderLeftActions={isReadOnly ? undefined : renderLeftActions}
        onSwipeableOpen={(direction) => { if (direction === 'left' && !isReadOnly) activateReply(item); }}
        leftThreshold={60}
        overshootLeft={false}
        friction={2}
        enabled={!isReadOnly}
      >
        <ChatMessageComp
          messageText={item?.messageText ?? ''}
          senderName={item?.senderName ?? ''}
          createdAt={item?.createdAt ?? ''}
          isOwn={isOwn}
          isVendorMessage={item?.senderId === chatInfo?.vendorUserId}
          messageType={item?.messageType}
          imageUrl={item?.imageUrl}
          status={item?.status}
          isEdited={item?.isEdited}
          deletedForAll={item?.deletedForAll}
          replyTo={item?.replyTo}
          onReplyPress={scrollToMessage}
          onLongPress={!isReadOnly && isOwn && !item?.deletedForAll ? () => openContextMenu(item) : undefined}
        />
      </Swipeable>
    );
  }, [user?.id, chatInfo?.vendorUserId, renderLeftActions, activateReply, scrollToMessage, openContextMenu, isReadOnly]);

  if (loading) return <LoadingSpinner />;

  const replyPreviewText = replyingTo
    ? ((replyingTo?.messageType ?? 'text') === 'image' ? 'Imagen' : (replyingTo?.messageText ?? ''))
    : '';
  const replyPreviewSnippet = replyPreviewText.length > 50 ? replyPreviewText.substring(0, 47) + '...' : replyPreviewText;

  const isEditMode = !!editingMessage;
  const canSend = !!(text?.trim?.());

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{chatInfo?.otherUserName ?? 'Chat'}</Text>
          <Text style={styles.headerSummary} numberOfLines={1}>{chatInfo?.requestSummary ?? ''}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages ?? []}
          keyExtractor={(item) => item?.id ?? Math.random().toString()}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={<Text style={styles.emptyChat}>No hay mensajes aún. ¡Inicia la conversación!</Text>}
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset?.({ offset: info.averageItemLength * info.index, animated: true });
          }}
        />

        {uploading ? (
          <View style={styles.uploadingBar}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.uploadingText}>Subiendo imagen...</Text>
          </View>
        ) : null}

        {isReadOnly ? (
          <View style={styles.readOnlyBar}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.readOnlyText}>Esta solicitud fue cerrada. Solo lectura.</Text>
          </View>
        ) : (
          <>
            {showAttachMenu ? (
              <View style={styles.attachMenu}>
                <Pressable style={styles.attachOption} onPress={() => pickAndSendImage('gallery')}>
                  <Ionicons name="images" size={24} color={colors.primary} />
                  <Text style={styles.attachOptionText}>Galería</Text>
                </Pressable>
                <Pressable style={styles.attachOption} onPress={() => pickAndSendImage('camera')}>
                  <Ionicons name="camera" size={24} color={colors.primary} />
                  <Text style={styles.attachOptionText}>Cámara</Text>
                </Pressable>
              </View>
            ) : null}

            {isEditMode ? (
              <View style={styles.editBar}>
                <View style={styles.editBarLeft}>
                  <Ionicons name="pencil" size={16} color={colors.primary} />
                  <Text style={styles.editBarLabel}>Editando mensaje</Text>
                </View>
                <Pressable onPress={cancelEdit} hitSlop={8}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            ) : null}

            {replyingTo && !isEditMode ? (
              <View style={styles.replyBar}>
                <View style={styles.replyBarLeft}>
                  <View style={styles.replyBarAccent} />
                  <View style={styles.replyBarContent}>
                    <Text style={styles.replyBarName} numberOfLines={1}>{replyingTo?.senderName ?? ''}</Text>
                    <Text style={styles.replyBarText} numberOfLines={1}>{replyPreviewSnippet}</Text>
                  </View>
                </View>
                <Pressable onPress={cancelReply} style={styles.replyBarClose} hitSlop={8}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.inputBar}>
              {!isEditMode ? (
                <Pressable style={styles.attachBtn} onPress={() => setShowAttachMenu((v) => !v)} disabled={uploading}>
                  <Ionicons name={showAttachMenu ? 'close' : 'attach'} size={24} color={uploading ? colors.textSecondary : colors.primary} />
                </Pressable>
              ) : null}
              <TextInput
                ref={inputRef}
                style={[styles.input, isEditMode && { marginLeft: Spacing.sm }]}
                value={text}
                onChangeText={setText}
                placeholder={isEditMode ? 'Editar mensaje...' : 'Escribe un mensaje...'}
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={1000}
                onFocus={() => setShowAttachMenu(false)}
              />
              <Pressable
                style={[styles.sendBtn, (!canSend || sending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!canSend || sending}
              >
                <Ionicons name={isEditMode ? 'checkmark' : 'send'} size={20} color={canSend ? colors.accent : colors.textSecondary} />
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* Context menu */}
      <Modal visible={!!contextMenuMsg} transparent animationType="fade" onRequestClose={() => setContextMenuMsg(null)}>
        <Pressable style={styles.menuOverlay} onPress={() => setContextMenuMsg(null)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {(contextMenuMsg?.messageType === 'image' ? 'Imagen' : (contextMenuMsg?.messageText ?? '')).substring(0, 40)}
            </Text>
            {(contextMenuMsg?.messageType ?? 'text') !== 'image' ? (
              <Pressable style={styles.menuOption} onPress={handleEdit}>
                <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                <Text style={styles.menuOptionText}>Editar</Text>
              </Pressable>
            ) : null}
            <Pressable style={[styles.menuOption, styles.menuOptionDanger]} onPress={handleDeletePrompt}>
              <Ionicons name="trash-outline" size={20} color="#E53935" />
              <Text style={[styles.menuOptionText, { color: '#E53935' }]}>Eliminar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Delete confirmation */}
      <Modal visible={!!deleteConfirmMsg} transparent animationType="fade" onRequestClose={() => setDeleteConfirmMsg(null)}>
        <Pressable style={styles.menuOverlay} onPress={() => setDeleteConfirmMsg(null)}>
          <View style={styles.menuCard}>
            <Ionicons name="warning-outline" size={32} color="#E53935" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.deleteTitle}>¿Eliminar este mensaje?</Text>
            <Text style={styles.deleteSubtitle}>El mensaje será reemplazado por "Mensaje eliminado" para ambos participantes.</Text>
            <View style={styles.deleteActions}>
              <Pressable style={styles.deleteCancelBtn} onPress={() => setDeleteConfirmMsg(null)}>
                <Text style={styles.deleteCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.deleteConfirmBtn} onPress={handleDeleteForAll}>
                <Text style={styles.deleteConfirmText}>Eliminar para todos</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

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
  if (signedHeaders?.includes?.('content-disposition')) { headers['Content-Disposition'] = 'attachment'; }
  await fetch(uploadUrl, { method: 'PUT', body: blob, headers });
  const result = await completeUpload(storagePath, fileName, contentType);
  return { url: result?.url ?? '', storagePath };
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.surface,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: 4 },
  headerName: { fontSize: 16, fontWeight: '600', color: c.textPrimary },
  headerSummary: { fontSize: 12, color: c.textSecondary },
  messageList: { padding: Spacing.sm, paddingBottom: Spacing.md },
  emptyChat: { textAlign: 'center', color: c.textSecondary, padding: Spacing.xl },
  readOnlyBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: Spacing.md,
    backgroundColor: c.backgroundSection, borderTopWidth: 1, borderTopColor: c.border,
  },
  readOnlyText: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
  uploadingBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, backgroundColor: c.backgroundSection,
  },
  uploadingText: { marginLeft: 8, fontSize: 13, color: c.textSecondary },
  attachMenu: {
    flexDirection: 'row', justifyContent: 'space-evenly',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border,
  },
  attachOption: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 24 },
  attachOptionText: { fontSize: 12, color: c.textPrimary, marginTop: 4 },
  swipeReplyAction: { width: 60, justifyContent: 'center', alignItems: 'center' },
  editBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: `${c.primary}15`, borderTopWidth: 1, borderTopColor: c.border,
  },
  editBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editBarLabel: { fontSize: 13, fontWeight: '600', color: c.primary },
  replyBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border,
  },
  replyBarLeft: { flexDirection: 'row', alignItems: 'stretch', flex: 1, marginRight: 8 },
  replyBarAccent: { width: 3, backgroundColor: c.primary, borderRadius: 2, marginRight: 8 },
  replyBarContent: { flex: 1, justifyContent: 'center' },
  replyBarName: { fontSize: 12, fontWeight: '700', color: c.primary },
  replyBarText: { fontSize: 13, color: c.textSecondary, marginTop: 1 },
  replyBarClose: { padding: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.sm,
    borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface,
  },
  attachBtn: { width: 40, height: 44, justifyContent: 'center', alignItems: 'center' },
  input: {
    flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 20,
    paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: 15,
    color: c.textPrimary, maxHeight: 100, backgroundColor: c.inputBg,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary,
    justifyContent: 'center', alignItems: 'center', marginLeft: Spacing.sm,
  },
  sendBtnDisabled: { backgroundColor: c.border },
  menuOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center',
  },
  menuCard: {
    width: 280, backgroundColor: c.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 8 },
      default: {},
    }),
  },
  menuTitle: {
    fontSize: 13, color: c.textSecondary, marginBottom: 12,
    paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  menuOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10,
  },
  menuOptionDanger: {},
  menuOptionText: { fontSize: 15, fontWeight: '500', color: c.textPrimary },
  deleteTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary, textAlign: 'center', marginBottom: 6 },
  deleteSubtitle: { fontSize: 13, color: c.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  deleteActions: { flexDirection: 'row', gap: 10 },
  deleteCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: BorderRadius.md,
    backgroundColor: c.backgroundSection, alignItems: 'center',
  },
  deleteCancelText: { fontSize: 14, fontWeight: '600', color: c.textPrimary },
  deleteConfirmBtn: {
    flex: 1, paddingVertical: 12, borderRadius: BorderRadius.md,
    backgroundColor: '#E53935', alignItems: 'center',
  },
  deleteConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
