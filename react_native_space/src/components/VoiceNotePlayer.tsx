import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform,
  GestureResponderEvent, LayoutChangeEvent,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius } from '../theme/colors';
import type { ThemeColors } from '../theme/colors';

interface VoiceNotePlayerProps {
  audioUrl: string;
  duration: number; // seconds
  isOwn: boolean;
  isVendorMessage?: boolean;
}

const BAR_COUNT = 28;
const SPEED_OPTIONS = [1, 1.5, 2] as const;

// Session-level speed memory
let sessionSpeed = 1;

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

// Generate pseudo-random bar heights for waveform visualization
function generateBars(count: number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const base = 0.3 + Math.sin(i * 0.5) * 0.2 + Math.sin(i * 1.3) * 0.15;
    const noise = ((i * 7 + 13) % 17) / 17 * 0.4;
    bars.push(Math.min(1, Math.max(0.15, base + noise)));
  }
  return bars;
}

export default function VoiceNotePlayer({ audioUrl, duration, isOwn, isVendorMessage }: VoiceNotePlayerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [position, setPosition] = useState(0); // ms
  const [totalDuration, setTotalDuration] = useState((duration ?? 0) * 1000); // ms
  const [speed, setSpeed] = useState(sessionSpeed);
  const soundRef = useRef<Audio.Sound | null>(null);
  const bars = useMemo(() => generateBars(BAR_COUNT), []);
  const waveLayoutRef = useRef({ x: 0, width: 0 });
  const isSeeking = useRef(false);

  const progress = totalDuration > 0 ? Math.min(1, position / totalDuration) : 0;
  const displayTime = isPlaying || position > 0
    ? formatDuration(position / 1000)
    : formatDuration(duration ?? 0);

  const accentColor = isVendorMessage ? '#D4A017' : colors.primary;
  const barInactiveColor = isVendorMessage
    ? 'rgba(180, 140, 20, 0.35)'
    : `${colors.primary}40`;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync?.().catch(() => {});
    };
  }, []);

  // Playback status callback
  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status?.isLoaded) {
      if ((status as any)?.error) {
        setIsPlaying(false);
        setIsLoading(false);
      }
      return;
    }
    if (!isSeeking.current) {
      setPosition(status.positionMillis ?? 0);
    }
    if (status.durationMillis) {
      setTotalDuration(status.durationMillis);
    }
    setIsBuffering(status.isBuffering ?? false);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPosition(0);
    }
  }, []);

  // Ensure sound is loaded (returns the sound object)
  const ensureLoaded = useCallback(async (): Promise<Audio.Sound | null> => {
    if (soundRef.current) return soundRef.current;

    setIsLoading(true);
    try {
      // Reset audio mode to playback (critical after recording on Android)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: false,
          progressUpdateIntervalMillis: 80,
          rate: speed,
          shouldCorrectPitch: true,
        },
        onPlaybackStatusUpdate,
      );
      soundRef.current = sound;
      setIsLoading(false);
      return sound;
    } catch (err) {
      console.error('[VoiceNotePlayer] Error loading audio:', audioUrl, err);
      setIsLoading(false);
      return null;
    }
  }, [audioUrl, speed, onPlaybackStatusUpdate]);

  // Toggle play/pause
  const togglePlayback = useCallback(async () => {
    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      const sound = await ensureLoaded();
      if (!sound) {
        console.error('[VoiceNotePlayer] Could not load sound for:', audioUrl);
        return;
      }

      // If at the end, restart
      const status = await sound.getStatusAsync();
      if (status?.isLoaded && status?.durationMillis && status.positionMillis >= status.durationMillis - 200) {
        await sound.setPositionAsync(0);
      }
      await sound.playAsync();
      setIsPlaying(true);
    } catch (err) {
      console.error('[VoiceNotePlayer] Playback error:', err);
      setIsPlaying(false);
    }
  }, [isPlaying, ensureLoaded, audioUrl]);

  // Speed toggle
  const cycleSpeed = useCallback(async () => {
    const currentIdx = SPEED_OPTIONS.indexOf(speed as any);
    const nextSpeed = SPEED_OPTIONS[(currentIdx + 1) % SPEED_OPTIONS.length];
    setSpeed(nextSpeed);
    sessionSpeed = nextSpeed;
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(nextSpeed, true);
      } catch { /* ignore */ }
    }
  }, [speed]);

  // Seek via touch on waveform
  const handleWaveLayout = useCallback((e: LayoutChangeEvent) => {
    waveLayoutRef.current = {
      x: e.nativeEvent.layout.x,
      width: e.nativeEvent.layout.width,
    };
  }, []);

  const seekToTouch = useCallback(async (pageX: number) => {
    const layout = waveLayoutRef.current;
    if (layout.width <= 0 || totalDuration <= 0) return;

    // We need to find the bar container's position on screen
    const ratio = Math.max(0, Math.min(1, pageX / layout.width));
    const seekMs = Math.round(ratio * totalDuration);

    isSeeking.current = true;
    setPosition(seekMs);

    const sound = await ensureLoaded();
    if (sound) {
      try {
        await sound.setPositionAsync(seekMs);
      } catch { /* ignore */ }
    }
    isSeeking.current = false;
  }, [totalDuration, ensureLoaded]);

  const handleSeekStart = useCallback((e: GestureResponderEvent) => {
    const touchX = e.nativeEvent.locationX;
    seekToTouch(touchX);
  }, [seekToTouch]);

  const handleSeekMove = useCallback((e: GestureResponderEvent) => {
    const touchX = e.nativeEvent.locationX;
    seekToTouch(touchX);
  }, [seekToTouch]);

  return (
    <View style={styles.container}>
      {/* Play/Pause button */}
      <Pressable
        onPress={togglePlayback}
        style={[styles.playBtn, { backgroundColor: accentColor }]}
        disabled={isLoading}
      >
        <Ionicons
          name={isLoading ? 'hourglass-outline' : isPlaying ? 'pause' : 'play'}
          size={20}
          color="#fff"
          style={!isPlaying && !isLoading ? { marginLeft: 2 } : undefined}
        />
      </Pressable>

      {/* Waveform (seekable) */}
      <View
        style={styles.waveContainer}
        onLayout={handleWaveLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleSeekStart}
        onResponderMove={handleSeekMove}
      >
        <View style={styles.barsRow} pointerEvents="none">
          {bars.map((h, i) => {
            const barProgress = i / BAR_COUNT;
            const isActive = barProgress <= progress;
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: 4 + h * 20,
                    backgroundColor: isActive ? accentColor : barInactiveColor,
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.bottomRow}>
          <Text style={[styles.duration, { color: colors.textSecondary }]}>{displayTime}</Text>
          {isBuffering && isPlaying ? (
            <Text style={[styles.bufferingText, { color: colors.textSecondary }]}>Cargando…</Text>
          ) : null}
        </View>
      </View>

      {/* Speed button */}
      <Pressable onPress={cycleSpeed} style={[styles.speedBtn, { borderColor: accentColor }]}>
        <Text style={[styles.speedText, { color: accentColor }]}>{speed}x</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 220,
    paddingVertical: 2,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    flex: 1,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1.5,
    height: 28,
  },
  bar: {
    flex: 1,
    borderRadius: 1.5,
    minWidth: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  duration: {
    fontSize: 11,
  },
  bufferingText: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  speedBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
  },
  speedText: {
    fontSize: 11,
    fontWeight: '700',
  },
});