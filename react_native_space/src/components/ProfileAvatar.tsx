import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Image as RNImage } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import { uploadFile } from '../services/upload';
import api from '../services/api';

interface ProfileAvatarProps {
  imageUrl?: string | null;
  initials: string;
  size?: number;
  onImageUpdated?: () => void;
}

export default function ProfileAvatar({ imageUrl, initials, size = 90, onImageUpdated }: ProfileAvatarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [uploading, setUploading] = useState(false);

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
      if (!result?.canceled && result?.assets?.[0]?.uri) await handleUpload(result.assets[0].uri);
    } catch { }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission?.status !== 'granted') { Alert.alert('Permiso Denegado', 'Necesitamos acceso a la cámara.'); return; }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
      if (!result?.canceled && result?.assets?.[0]?.uri) await handleUpload(result.assets[0].uri);
    } catch { }
  };

  const handleUpload = async (uri: string) => {
    setUploading(true);
    try {
      const storagePath = await uploadFile(uri, `profile_${Date.now()}.jpg`, 'image/jpeg', true);
      await api.patch('/users/profile', { profileImagePath: storagePath });
      onImageUpdated?.();
    } catch { Alert.alert('Error', 'No se pudo actualizar la imagen de perfil.'); }
    finally { setUploading(false); }
  };

  const showOptions = () => {
    Alert.alert('Cambiar Foto de Perfil', 'Selecciona una opción', [
      { text: 'Tomar Foto', onPress: takePhoto },
      { text: 'Seleccionar del Dispositivo', onPress: pickFromLibrary },
      { text: 'Cancelar', style: 'cancel' },
    ], { cancelable: true });
  };

  const halfSize = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Pressable onPress={showOptions} style={[styles.avatarWrapper, { width: size, height: size, borderRadius: halfSize }]}>
        {imageUrl ? (
          <RNImage source={{ uri: imageUrl }} style={[styles.image, { width: size, height: size, borderRadius: halfSize }]} resizeMode="cover" />
        ) : (
          <View style={[styles.initialsCircle, { width: size, height: size, borderRadius: halfSize }]}>
            <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
          </View>
        )}
        {uploading ? (
          <View style={[styles.overlay, { borderRadius: halfSize }]}>
            <ActivityIndicator size="small" color={colors.white} />
          </View>
        ) : (
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color={colors.white} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { alignSelf: 'center' },
  avatarWrapper: { position: 'relative' },
  image: { backgroundColor: c.backgroundSection },
  initialsCircle: { backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center' },
  initials: { fontWeight: '700', color: c.accent },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: c.surface },
});
