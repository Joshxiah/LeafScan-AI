/**
 * Full-screen photo viewer with zoom.
 *
 * Pinch to zoom in and out, drag to move around while zoomed in, double-tap
 * to jump to a close-up and back. The X (or the Android back button) closes it.
 *
 * Built on react-native-gesture-handler + react-native-reanimated, which are
 * already in the app: the gestures run on the UI thread, so zooming stays
 * smooth. React Native's own ScrollView zoom only works on iOS, which is why
 * it is not used here.
 *
 * The viewer's content is mounted only while it is open, so every opening
 * starts at the normal size.
 */

import { useMemo, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  Modal,
  Pressable,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
/** Zoom level a double-tap jumps to. */
const DOUBLE_TAP_SCALE = 2.5;
const ZOOM_MS = 220;

interface ZoomableImageModalProps {
  visible: boolean;
  source: ImageSourcePropType;
  onClose: () => void;
}

export default function ZoomableImageModal({ visible, source, onClose }: ZoomableImageModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* A Modal is its own native window on Android, so it needs its own gesture root. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {visible ? <Viewer source={source} onClose={onClose} /> : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

function Viewer({ source, onClose }: { source: ImageSourcePropType; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  // Room available for the photo, and the photo's own proportions.
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const natural = useMemo(() => {
    const resolved = Image.resolveAssetSource(source);
    return resolved?.width && resolved?.height ? { w: resolved.width, h: resolved.height } : null;
  }, [source]);

  // The photo as drawn at normal size: as large as fits, same shape as the file.
  const fit = useMemo(() => {
    if (!box) return null;
    if (!natural) return box;
    const ratio = Math.min(box.w / natural.w, box.h / natural.h);
    return { w: natural.w * ratio, h: natural.h * ratio };
  }, [box, natural]);

  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const gesture = useMemo(() => {
    if (!box || !fit) return null;
    const { w: boxW, h: boxH } = box;
    const { w: fitW, h: fitH } = fit;

    const pinch = Gesture.Pinch()
      .onStart(() => {
        startScale.value = scale.value;
      })
      .onUpdate((event) => {
        scale.value = clamp(startScale.value * event.scale, MIN_SCALE, MAX_SCALE);
        // Zooming back out pulls the photo back toward the middle.
        x.value = clamp(x.value, -maxOffset(fitW, boxW, scale.value), maxOffset(fitW, boxW, scale.value));
        y.value = clamp(y.value, -maxOffset(fitH, boxH, scale.value), maxOffset(fitH, boxH, scale.value));
      });

    const pan = Gesture.Pan()
      .onStart(() => {
        startX.value = x.value;
        startY.value = y.value;
      })
      .onUpdate((event) => {
        // The photo can be moved only until its edge meets the screen edge.
        const limitX = maxOffset(fitW, boxW, scale.value);
        const limitY = maxOffset(fitH, boxH, scale.value);
        x.value = clamp(startX.value + event.translationX, -limitX, limitX);
        y.value = clamp(startY.value + event.translationY, -limitY, limitY);
      });

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd((_event, success) => {
        if (!success) return;
        if (scale.value > MIN_SCALE + 0.01) {
          scale.value = withTiming(MIN_SCALE, { duration: ZOOM_MS });
          x.value = withTiming(0, { duration: ZOOM_MS });
          y.value = withTiming(0, { duration: ZOOM_MS });
        } else {
          scale.value = withTiming(DOUBLE_TAP_SCALE, { duration: ZOOM_MS });
        }
      });

    return Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));
  }, [box, fit, scale, startScale, x, y, startX, startY]);

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setBox({ w: width, h: height });
  }

  return (
    <View className="flex-1 bg-black/95" onLayout={handleLayout}>
      {gesture && fit ? (
        <GestureDetector gesture={gesture}>
          <View className="flex-1 items-center justify-center">
            <Animated.View style={photoStyle}>
              <Image
                source={source}
                style={{ width: fit.w, height: fit.h }}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </Animated.View>
          </View>
        </GestureDetector>
      ) : null}

      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
        className="absolute right-5 h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
        style={{ top: insets.top + 12 }}
      >
        <Ionicons name="close" size={22} color="#ffffff" />
      </Pressable>
    </View>
  );
}

/** Marked as a worklet so the gesture callbacks (UI thread) can call it. */
function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/** How far the photo may be moved from the middle, for one axis, at this zoom. */
function maxOffset(fitSize: number, boxSize: number, scale: number) {
  'worklet';
  return Math.max(0, (fitSize * scale - boxSize) / 2);
}
