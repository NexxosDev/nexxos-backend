import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';
import SelectInput from './SelectInput';
import type { CatalogItem } from '../types';

let MapView: any;
let Circle: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Circle = maps.Circle;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (e) { console.warn('react-native-maps not available'); }
}

interface RequestLocationMapProps {
  states: CatalogItem[];
  municipalities: CatalogItem[];
  parishes: CatalogItem[];
  onLocationChange: (data: {
    filterType: 'radius' | 'state' | 'municipality' | 'parish';
    stateId?: string; municipalityId?: string; parishId?: string;
    radiusKm?: number; latitude?: number; longitude?: number;
  }) => void;
  onMunicipalitiesNeeded?: (stateId: string) => void;
  onParishesNeeded?: (municipalityId: string) => void;
}

const DEFAULT_RADIUS_KM = 5;
type FilterType = 'radius' | 'state' | 'municipality' | 'parish';
const FILTER_OPTIONS: { id: FilterType; name: string }[] = [
  { id: 'radius', name: 'Radio (5 km)' },
  { id: 'state', name: 'Estado' },
  { id: 'municipality', name: 'Municipio' },
  { id: 'parish', name: 'Parroquia' },
];

export default function RequestLocationMap({ states, municipalities, parishes, onLocationChange, onMunicipalitiesNeeded, onParishesNeeded }: RequestLocationMapProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('radius');
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState('');
  const [selectedParishId, setSelectedParishId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permiso Denegado', 'Necesitamos acceso a tu ubicación para mostrar vendedores cercanos.'); setLoading(false); return; }
        const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation(currentLocation); setLoading(false);
        onLocationChange?.({ filterType: 'radius', radiusKm: DEFAULT_RADIUS_KM, latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude });
      } catch (error) { console.error('Error obteniendo ubicación:', error); Alert.alert('Error', 'No pudimos obtener tu ubicación actual.'); setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const coords = location?.coords;
    if (filterType === 'radius') {
      if (coords) onLocationChange?.({ filterType: 'radius', radiusKm: DEFAULT_RADIUS_KM, latitude: coords.latitude, longitude: coords.longitude });
    } else if (filterType === 'state') {
      onLocationChange?.({ filterType: 'state', stateId: selectedStateId || undefined, latitude: coords?.latitude, longitude: coords?.longitude });
    } else if (filterType === 'municipality') {
      onLocationChange?.({ filterType: 'municipality', stateId: selectedStateId || undefined, municipalityId: selectedMunicipalityId || undefined, latitude: coords?.latitude, longitude: coords?.longitude });
    } else if (filterType === 'parish') {
      onLocationChange?.({ filterType: 'parish', stateId: selectedStateId || undefined, municipalityId: selectedMunicipalityId || undefined, parishId: selectedParishId || undefined, latitude: coords?.latitude, longitude: coords?.longitude });
    }
  }, [filterType, selectedStateId, selectedMunicipalityId, selectedParishId, location]);

  const handleFilterChange = (item: any) => {
    if (!item) return;
    setFilterType(item.id);
    setSelectedStateId('');
    setSelectedMunicipalityId('');
    setSelectedParishId('');
  };

  const handleStateChange = (item: CatalogItem | null) => {
    const sid = item?.id ?? '';
    setSelectedStateId(sid);
    setSelectedMunicipalityId('');
    setSelectedParishId('');
    if (sid) onMunicipalitiesNeeded?.(sid);
  };

  const handleMunicipalityChange = (item: CatalogItem | null) => {
    const mid = item?.id ?? '';
    setSelectedMunicipalityId(mid);
    setSelectedParishId('');
    if (mid) onParishesNeeded?.(mid);
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Obteniendo tu ubicación...</Text></View>;
  if (!location) return <View style={styles.errorContainer}><Text style={styles.errorText}>No pudimos obtener tu ubicación</Text></View>;

  const region = { latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  const showState = filterType === 'state' || filterType === 'municipality' || filterType === 'parish';
  const showMunicipality = filterType === 'municipality' || filterType === 'parish';
  const showParish = filterType === 'parish';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Dónde necesitas el repuesto?</Text>
      {Platform.OS !== 'web' && MapView && (
        <View style={styles.mapContainer}>
          <MapView style={styles.map} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} initialRegion={region} showsUserLocation showsMyLocationButton>
            <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} title="Tu ubicación" />
            {filterType === 'radius' && Circle && <Circle center={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} radius={DEFAULT_RADIUS_KM * 1000} fillColor="rgba(255, 193, 7, 0.2)" strokeColor="rgba(255, 193, 7, 0.6)" strokeWidth={2} />}
          </MapView>
        </View>
      )}
      {Platform.OS === 'web' && (
        <View style={styles.webLocationInfo}>
          <Text style={styles.webLocationText}>📍 Ubicación detectada: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}</Text>
          <Text style={styles.webLocationSubtext}>(El mapa interactivo está disponible en la aplicación móvil)</Text>
        </View>
      )}
      <View style={styles.filtersContainer}>
        <SelectInput label="Tipo de Búsqueda" items={FILTER_OPTIONS as any} selectedId={filterType} onSelect={handleFilterChange as any} />
        {showState && (
          <SelectInput label="Selecciona un Estado" items={states} selectedId={selectedStateId} onSelect={handleStateChange} searchable />
        )}
        {showMunicipality && selectedStateId ? (
          <SelectInput label="Selecciona un Municipio" items={municipalities} selectedId={selectedMunicipalityId} onSelect={handleMunicipalityChange} searchable />
        ) : null}
        {showParish && selectedMunicipalityId ? (
          <SelectInput label="Selecciona una Parroquia" items={parishes} selectedId={selectedParishId} onSelect={(item) => setSelectedParishId(item?.id ?? '')} searchable />
        ) : null}
        {filterType === 'radius' && (
          <View style={styles.radiusInfo}>
            <Text style={styles.radiusText}>🔍 Buscando en un radio de <Text style={styles.radiusBold}>{DEFAULT_RADIUS_KM} km</Text> desde tu ubicación</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: c.textPrimary, marginBottom: Spacing.md },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  loadingText: { marginTop: Spacing.md, fontSize: 15, color: c.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  errorText: { fontSize: 15, color: c.error, textAlign: 'center' },
  mapContainer: { height: 300, borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.md },
  map: { flex: 1 },
  filtersContainer: { gap: Spacing.sm },
  radiusInfo: { backgroundColor: c.backgroundSection, padding: Spacing.md, borderRadius: BorderRadius.md, borderLeftWidth: 3, borderLeftColor: c.warning },
  radiusText: { fontSize: 14, color: c.textSecondary, lineHeight: 20 },
  radiusBold: { fontWeight: '700', color: c.textPrimary },
  webLocationInfo: { backgroundColor: c.backgroundSection, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: c.primary },
  webLocationText: { fontSize: 15, color: c.textPrimary, fontWeight: '600', marginBottom: 4 },
  webLocationSubtext: { fontSize: 13, color: c.textSecondary },
});
