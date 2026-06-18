import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Animated, Modal,
  ImageBackground,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { directUpload as directUploadFile } from '../src/services/upload';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
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
import QuickReplyPicker from '../src/components/QuickReplyPicker';
import { Spacing, BorderRadius } from '../src/theme/colors';
import type { ThemeColors } from '../src/theme/colors';
import ChatMessageComp from '../src/components/ChatMessage';
import ImageEditorModal from '../src/components/ImageEditorModal';
import LoadingSpinner from '../src/components/LoadingSpinner';
import { getDateKey, getDateLabel } from '../src/utils/dateSeparator';
import type { ChatInfo, ChatMessageItem } from '../src/types';
import useChatSounds from '../src/hooks/useChatSounds';

const textureDark = require('../assets/images/texture-chat-dark.png');
const textureLight = require('../assets/images/texture-chat-light.png');

export default function ChatScreen() {
  const router = useRouter();
  const { chatId = '', readOnly: readOnlyParam = '' } = useLocalSearchParams<{ chatId: string; readOnly?: string }>();
  const isReadOnly = readOnlyParam === '1';
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { refresh: refreshUnread } = useUnread();
  const { playSend, playReceive } = useChatSounds();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const draftKey = chatId ? `chat_draft_${chatId}` : '';
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on mount
  useEffect(() => {
    if (!draftKey) return;
    AsyncStorage.getItem(draftKey).then((saved) => {
      if (saved) setText(saved);
    }).catch(() => {});
  }, [draftKey]);

  // Save draft with debounce (500ms)
  const setTextWithDraft = useCallback((val: string) => {
    setText(val);
    if (!draftKey) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      if (val) {
        AsyncStorage.setItem(draftKey, val).catch(() => {});
      } else {
        AsyncStorage.removeItem(draftKey).catch(() => {});
      }
    }, 500);
  }, [draftKey]);

  // Clear draft helper — also cancel any pending debounce save
  const clearDraft = useCallback(() => {
    if (draftTimerRef.current) { clearTimeout(draftTimerRef.current); draftTimerRef.current = null; }
    if (draftKey) AsyncStorage.removeItem(draftKey).catch(() => {});
  }, [draftKey]);

  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [editorImageUri, setEditorImageUri] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessageItem | null>(null);

  // Edit mode
  const [editingMessage, setEditingMessage] = useState<ChatMessageItem | null>(null);
  // Context menu
  const [contextMenuMsg, setContextMenuMsg] = useState<ChatMessageItem | null>(null);
  // Delete confirmation
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<ChatMessageItem | null>(null);
  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  const prevMsgIdsRef = useRef<Set<string>>(new Set());

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const data = await getChatMessages(chatId, { limit: 50 });
      const items = data?.items ?? [];
      const prevIds = prevMsgIdsRef.current;

      // Detect new messages from other users (not initial load)
      if (prevIds.size > 0) {
        const hasNewFromOther = items.some(
          (m) => m?.id && !m.id.startsWith('temp_') && !prevIds.has(m.id) && m.senderId !== user?.id,
        );
        if (hasNewFromOther) playReceive();
      }

      // Update tracked ids
      const newIds = new Set<string>();
      items.forEach((m) => { if (m?.id) newIds.add(m.id); });
      prevMsgIdsRef.current = newIds;

      setMessages(items);
    } catch { }
  }, [chatId, user?.id, playReceive]);

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
      // Continuously dismiss any tray notifications for this chat
      // (covers edge cases: push arrived just before presence was reported, background delays, etc.)
      if (chatId) dismissNotificationsForContext({ chatId }).catch(() => {});
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchMessages, markAsDeliveredAndRead, chatId]);

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
      clearDraft();
      setReplyingTo(null);
      playSend();

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
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm?.granted) { Alert.alert('Permiso necesario', 'Necesitas permitir el acceso a la galería.'); return; }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      }
      if (result?.canceled || !result?.assets?.[0]) return;
      const asset = result.assets[0];
      const uri = asset?.uri ?? '';
      if (!uri) return;
      // Open custom editor instead of native crop
      setEditorImageUri(uri);
    } catch { }
  };

  const handleEditorSend = async (editedUri: string) => {
    setEditorImageUri(null);
    try {
      const fileName = editedUri.split('/').pop() ?? `image_${Date.now()}.jpg`;
      const contentType = 'image/jpeg';
      setUploading(true);
      const uploadRes = await uploadFileWithUrl(editedUri, fileName, contentType);
      const imageUrl = uploadRes?.url ?? '';
      if (imageUrl) {
        playSend();
        const newMsg = await sendChatMessage(chatId, 'Imagen', 'image', imageUrl, replyingTo?.id);
        if (newMsg) { setMessages((prev) => [newMsg, ...(prev ?? [])]); }
        setReplyingTo(null);
        Alert.alert('📷 Upload OK', `URL: ${imageUrl.substring(0, 80)}...`);
      } else {
        Alert.alert('📷 Upload FALLÓ', 'El servidor no retornó URL. Revisa logs del backend.');
      }
    } catch (e: any) {
      Alert.alert('📷 Error de imagen', `${e?.message ?? e}`);
    }
    setUploading(false);
  };

  // ---------- Location ----------
  const isClient = user?.id !== chatInfo?.vendorUserId;

  const handleSendLocation = async () => {
    setShowAttachMenu(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso necesario', 'Necesitas permitir el acceso a tu ubicación para compartirla.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc?.coords?.latitude;
      const lng = loc?.coords?.longitude;
      if (lat == null || lng == null) {
        Alert.alert('Error', 'No se pudo obtener tu ubicación.');
        return;
      }

      // Reverse geocode for address
      let addr = '';
      try {
        const geocoded = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const g = geocoded?.[0];
        if (g) {
          // Filter out Plus Codes (e.g. "H88F+RVP") and technical strings
          const plusCodeRegex = /^[A-Z0-9]{4,}\+[A-Z0-9]{2,}/i;
          const parts = [g.street, g.name, g.district, g.city, g.region]
            .filter((p) => !!p && !plusCodeRegex.test(p?.trim?.() ?? ''));
          addr = parts.join(', ');
        }
      } catch { /* use empty address */ }

      const displayAddr = addr || 'Mi ubicación actual';

      // Confirm
      Alert.alert(
        'Enviar ubicación',
        displayAddr,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Enviar',
            onPress: async () => {
              setSending(true);
              try {
                playSend();
                const newMsg = await sendChatMessage(
                  chatId, 'Ubicación', 'location', undefined,
                  replyingTo?.id, lat, lng, displayAddr,
                );
                if (newMsg) { setMessages((prev) => [newMsg, ...(prev ?? [])]); }
                setReplyingTo(null);
              } catch {
                Alert.alert('Error', 'No se pudo enviar la ubicación.');
              }
              setSending(false);
            },
          },
        ],
      );
    } catch {
      Alert.alert('Error', 'No se pudo acceder a la ubicación.');
    }
  };

  // ---------- Voice recording ----------
  const formatRecTime = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r < 10 ? '0' : ''}${r}`;
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm?.granted) {
        Alert.alert('Permiso necesario', 'Necesitas permitir el acceso al micrófono para grabar notas de voz.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      setShowAttachMenu(false);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      Alert.alert('Error', 'No se pudo iniciar la grabación.');
    }
  };

  const cancelRecording = async () => {
    try {
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
      await recordingRef.current?.stopAndUnloadAsync?.().catch(() => {});
      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch { /* ignore */ }
  };

  const stopAndSendRecording = async () => {
    if (!recordingRef.current) return;
    try {
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI() ?? '';
      const status = await recordingRef.current.getStatusAsync();
      const durationSec = Math.round((status?.durationMillis ?? 0) / 1000);
      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (!uri || durationSec < 1) {
        Alert.alert('Muy corto', 'La nota de voz es muy corta.');
        return;
      }

      // Upload to S3
      setUploading(true);
      try {
        const fileName = `voice_${Date.now()}.m4a`;
        const contentType = 'audio/mp4';
        const uploadRes = await uploadFileWithUrl(uri, fileName, contentType);
        const audioUrlResult = uploadRes?.url ?? '';
        if (audioUrlResult) {
          playSend();
          const newMsg = await sendChatMessage(
            chatId, 'Nota de voz', 'audio', undefined,
            replyingTo?.id, undefined, undefined, undefined,
            audioUrlResult, durationSec,
          );
          if (newMsg) { setMessages((prev) => [newMsg, ...(prev ?? [])]); }
          setReplyingTo(null);
          Alert.alert('🎤 Upload OK', `Duración: ${durationSec}s\nURL: ${audioUrlResult.substring(0, 80)}...`);
        } else {
          Alert.alert('🎤 Upload FALLÓ', 'El servidor no retornó URL. Revisa logs del backend.');
        }
      } catch (e2: any) {
        Alert.alert('🎤 Error de audio', `${e2?.message ?? e2}`);
      }
      setUploading(false);
    } catch (e3: any) {
      setIsRecording(false);
      setRecordingDuration(0);
      console.error('Voice record error:', e3?.message ?? e3);
    }
  };

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingRef.current?.stopAndUnloadAsync?.().catch(() => {});
    };
  }, []);

  // ---------- Toast ----------
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2000);
  }, []);

  // ---------- Context menu ----------
  const openContextMenu = useCallback((msg: ChatMessageItem) => {
    setContextMenuMsg(msg);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!contextMenuMsg) return;
    const type = contextMenuMsg?.messageType ?? 'text';
    let textToCopy = contextMenuMsg?.messageText ?? '';
    if (type === 'image') textToCopy = contextMenuMsg?.imageUrl ?? 'Imagen';
    else if (type === 'location') textToCopy = contextMenuMsg?.addressText ?? `${contextMenuMsg?.latitude ?? ''},${contextMenuMsg?.longitude ?? ''}`;
    else if (type === 'audio') textToCopy = contextMenuMsg?.audioUrl ?? 'Nota de voz';
    try {
      await Clipboard.setStringAsync(textToCopy);
      showToast('Mensaje copiado');
    } catch { }
    setContextMenuMsg(null);
  }, [contextMenuMsg, showToast]);

  const handleReplyFromMenu = useCallback(() => {
    if (!contextMenuMsg) return;
    activateReply(contextMenuMsg);
    setContextMenuMsg(null);
  }, [contextMenuMsg, activateReply]);

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

  const renderMessage = useCallback(({ item, index }: { item: ChatMessageItem; index: number }) => {
    const isOwn = item?.senderId === user?.id;
    const currentKey = getDateKey(item?.createdAt ?? '');
    const nextItem = (messages ?? [])[index + 1];
    const nextKey = nextItem ? getDateKey(nextItem?.createdAt ?? '') : '';
    // In inverted list: show separator AFTER this item when date differs from next (older) item,
    // or when this is the last (oldest) item — this renders the label visually ABOVE the day group.
    const showSeparator = currentKey && (currentKey !== nextKey);

    return (
      <>
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
            latitude={item?.latitude}
            longitude={item?.longitude}
            addressText={item?.addressText}
            audioUrl={item?.audioUrl}
            audioDuration={item?.audioDuration}
            status={item?.status}
            isEdited={item?.isEdited}
            deletedForAll={item?.deletedForAll}
            replyTo={item?.replyTo}
            onReplyPress={scrollToMessage}
            onLongPress={!isReadOnly && !item?.deletedForAll ? () => openContextMenu(item) : undefined}
          />
        </Swipeable>
        {showSeparator ? (
          <View style={styles.dateSeparator}>
            <View style={styles.dateSeparatorPill}>
              <Text style={styles.dateSeparatorText}>{getDateLabel(item?.createdAt ?? '')}</Text>
            </View>
          </View>
        ) : null}
      </>
    );
  }, [user?.id, chatInfo?.vendorUserId, messages, renderLeftActions, activateReply, scrollToMessage, openContextMenu, isReadOnly, styles]);

  if (loading) return <LoadingSpinner />;

  const replyPreviewText = replyingTo
    ? ((replyingTo?.messageType ?? 'text') === 'image' ? 'Imagen' : (replyingTo?.messageType ?? 'text') === 'location' ? '📍 Ubicación' : (replyingTo?.messageType ?? 'text') === 'audio' ? '🎤 Nota de voz' : (replyingTo?.messageText ?? ''))
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
        <ImageBackground
          source={isDark ? textureDark : textureLight}
          resizeMode="repeat"
          imageStyle={{ opacity: 0.07 }}
          style={{ flex: 1 }}
        >
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
        </ImageBackground>

        {uploading ? (
          <View style={styles.uploadingBar}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.uploadingText}>Subiendo archivo...</Text>
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
                <View style={styles.attachGrid}>
                  <Pressable style={styles.attachOption} onPress={() => pickAndSendImage('camera')}>
                    <View style={[styles.attachCircle, { backgroundColor: '#E91E63' }]}>
                      <Ionicons name="camera" size={24} color="#fff" />
                    </View>
                    <Text style={styles.attachOptionText}>Cámara</Text>
                  </Pressable>
                  <Pressable style={styles.attachOption} onPress={() => pickAndSendImage('gallery')}>
                    <View style={[styles.attachCircle, { backgroundColor: '#7C3AED' }]}>
                      <Ionicons name="images" size={24} color="#fff" />
                    </View>
                    <Text style={styles.attachOptionText}>Galería</Text>
                  </Pressable>
                  {isClient ? (
                    <Pressable style={styles.attachOption} onPress={handleSendLocation}>
                      <View style={[styles.attachCircle, { backgroundColor: '#4CAF50' }]}>
                        <Ionicons name="location" size={24} color="#fff" />
                      </View>
                      <Text style={styles.attachOptionText}>Ubicación</Text>
                    </Pressable>
                  ) : null}
                </View>
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

            {isRecording ? (
              <View style={styles.recordingBar}>
                <Pressable style={styles.recordCancelBtn} onPress={cancelRecording}>
                  <Ionicons name="trash-outline" size={22} color="#E53935" />
                </Pressable>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingTime}>{formatRecTime(recordingDuration)}</Text>
                </View>
                <Pressable style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={stopAndSendRecording}>
                  <Ionicons name="send" size={20} color={colors.accent} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.inputBar}>
                {!isEditMode ? (
                  <Pressable style={styles.attachBtn} onPress={() => setShowAttachMenu((v) => !v)} disabled={uploading}>
                    <Ionicons name={showAttachMenu ? 'close' : 'attach'} size={24} color={uploading ? colors.textSecondary : colors.primary} />
                  </Pressable>
                ) : null}
                {!isEditMode && user?.id === chatInfo?.vendorUserId ? (
                  <QuickReplyPicker
                    onSelect={(t) => setTextWithDraft((text ? text + ' ' + t : t))}
                  />
                ) : null}
                <TextInput
                  ref={inputRef}
                  style={[styles.input, isEditMode && { marginLeft: Spacing.sm }]}
                  value={text}
                  onChangeText={setTextWithDraft}
                  placeholder={isEditMode ? 'Editar mensaje...' : 'Escribe un mensaje...'}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={1000}
                  onFocus={() => setShowAttachMenu(false)}
                />
                {canSend || isEditMode ? (
                  <Pressable
                    style={[styles.sendBtn, (!canSend || sending) && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!canSend || sending}
                  >
                    <Ionicons name={isEditMode ? 'checkmark' : 'send'} size={20} color={canSend ? colors.accent : colors.textSecondary} />
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.sendBtn, styles.micBtn]}
                    onPress={startRecording}
                    disabled={uploading}
                  >
                    <Ionicons name="mic" size={22} color="#fff" />
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>

      {/* Image Editor */}
      <Modal visible={!!editorImageUri} animationType="slide" onRequestClose={() => setEditorImageUri(null)}>
        {editorImageUri ? (
          <ImageEditorModal
            uri={editorImageUri}
            onSend={handleEditorSend}
            onCancel={() => setEditorImageUri(null)}
          />
        ) : null}
      </Modal>

      {/* Context menu */}
      <Modal visible={!!contextMenuMsg} transparent animationType="fade" onRequestClose={() => setContextMenuMsg(null)}>
        <Pressable style={styles.menuOverlay} onPress={() => setContextMenuMsg(null)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {(contextMenuMsg?.messageType === 'image' ? 'Imagen' : contextMenuMsg?.messageType === 'location' ? 'Ubicación' : contextMenuMsg?.messageType === 'audio' ? 'Nota de voz' : (contextMenuMsg?.messageText ?? '')).substring(0, 40)}
            </Text>
            <Pressable style={styles.menuOption} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
              <Text style={styles.menuOptionText}>Copiar</Text>
            </Pressable>
            <Pressable style={styles.menuOption} onPress={handleReplyFromMenu}>
              <Ionicons name="arrow-undo-outline" size={20} color={colors.primary} />
              <Text style={styles.menuOptionText}>Responder</Text>
            </Pressable>
            {contextMenuMsg?.senderId === user?.id && (contextMenuMsg?.messageType ?? 'text') === 'text' ? (
              <Pressable style={styles.menuOption} onPress={handleEdit}>
                <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                <Text style={styles.menuOptionText}>Editar</Text>
              </Pressable>
            ) : null}
            {contextMenuMsg?.senderId === user?.id ? (
              <Pressable style={[styles.menuOption, styles.menuOptionDanger]} onPress={handleDeletePrompt}>
                <Ionicons name="trash-outline" size={20} color="#E53935" />
                <Text style={[styles.menuOptionText, { color: '#E53935' }]}>Eliminar</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Modal>

      {/* Toast */}
      {toastMsg ? (
        <View style={styles.toastContainer} pointerEvents="none">
          <View style={styles.toastPill}>
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        </View>
      ) : null}

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
  try {
    const result = await directUploadFile(uri, fileName, contentType, true);
    return { url: result?.url ?? '', storagePath: result?.cloud_storage_path ?? '' };
  } catch (err: any) {
    const msg = err?.message ?? String(err ?? 'Unknown error');
    throw new Error(`Upload failed: ${msg}`);
  }
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
  dateSeparator: { alignItems: 'center', marginVertical: 10 },
  dateSeparatorPill: { backgroundColor: c.chipBg, paddingHorizontal: 14, paddingVertical: 5, borderRadius: BorderRadius.full },
  dateSeparatorText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
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
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border,
  },
  attachGrid: {
    flexDirection: 'row', justifyContent: 'flex-start', gap: 28,
  },
  attachOption: { alignItems: 'center', width: 64 },
  attachCircle: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  attachOptionText: { fontSize: 11, color: c.textPrimary, marginTop: 6, textAlign: 'center' },
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
  micBtn: { backgroundColor: '#3B82F6' },
  recordingBar: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.sm,
    borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface,
  },
  recordCancelBtn: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
  },
  recordingIndicator: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  recordingDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#E53935',
  },
  recordingTime: {
    fontSize: 18, fontWeight: '600', color: c.textPrimary, fontVariant: ['tabular-nums'],
  },
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
  // Toast
  toastContainer: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center', zIndex: 999 },
  toastPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.full },
  toastText: { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },
});
