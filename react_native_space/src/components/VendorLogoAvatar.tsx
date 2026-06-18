import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import type { ThemeColors } from '../theme/colors';
import { uploadFile } from '../services/upload';
import { updateVendorProfile } from '../services/vendor';

interface VendorLogoAvatarProps {
  logoUrl?: string | null;
  businessName: string;
  size?: number;
  onLogoUpdated?: () => void;
}

export default function VendorLogoAvatar({ logoUrl, businessName, size = 96, onLogoUpdated }: VendorLogoAvatarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [uploading, setUploading] = useState(false);
  const halfSize = size / 2;

  const initials = (businessName ?? '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w?.[0] ?? '')
    .join('')
    .toUpperCase();

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
      const storagePath = await uploadFile(uri, `vendor_logo_${Date.now()}.jpg`, 'image/jpeg', true);
      await updateVendorProfile({ logoPath: storagePath });
      onLogoUpdated?.();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el logo del negocio.');
    } finally {
      setUploading(false);
    }
  };

  const showOptions = () => {
    Alert.alert('Cambiar Logo', 'Selecciona una opción', [
      { text: 'Tomar Foto', onPress: takePhoto },
      { text: 'Seleccionar del Dispositivo', onPress: pickFromLibrary },
      { text: 'Cancelar', style: 'cancel' },
    ], { cancelable: true });
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Pressable onPress={showOptions} style={[styles.avatarWrapper, { width: size, height: size, borderRadius: halfSize }]}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={[styles.image, { width: size, height: size, borderRadius: halfSize }]} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.initialsCircle, { width: size, height: size, borderRadius: halfSize }]}>
            {initials ? (
              <Text style={[styles.initials, { fontSize: size * 0.3 }]}>{initials}</Text>
            ) : (
              <Ionicons name="storefront-outline" size={size * 0.4} color={colors.textSecondary} />
            )}
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
  avatarWrapper: { position: 'relative', overflow: 'hidden', borderWidth: 2, borderColor: c.primary },
  image: { backgroundColor: c.backgroundSection },
  initialsCircle: { backgroundColor: c.backgroundSection, justifyContent: 'center', alignItems: 'center' },
  initials: { fontWeight: '700', color: c.primary },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: c.surface },
});
