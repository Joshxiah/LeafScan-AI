/**
 * Full-screen crop editor, opened from the Preview screen (free-form) and for the
 * profile photo in Settings (locked to a square, see `aspect`).
 *
 * Shows the photo with a crop frame on top. Drag inside the frame to move it,
 * drag an edge or a corner to resize it. "Apply" cuts the photo down to the
 * frame and hands the new file to `onApply`; "Cancel" closes without changes.
 *
 * Built from plain React Native touch handling plus expo-image-manipulator
 * (already in the app for the on-device scan), so it needs no extra native module.
 *
 * The frame is stored as fractions (0..1) of the photo, so it does not depend on
 * the screen size or on the photo's pixel size.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Type only (erased at build time); the module itself is loaded lazily in handleApply.
import type { ImageRef } from 'expo-image-manipulator';

import { useLanguage } from '../context/LanguageContext';

interface CropModalProps {
  visible: boolean;
  /** Local file to crop. */
  uri: string;
  onCancel: () => void;
  /** Called with the cropped copy (a new local file). */
  onApply: (croppedUri: string) => void;
  /**
   * Keeps the frame at this width / height (1 = a square, e.g. for a profile photo),
   * so the cropped file has exactly that shape. Left out, the frame is free-form.
   */
  aspect?: number;
  /** Replaces the default instruction line under the title. */
  hint?: string;
}

/** The crop frame as fractions of the photo's width / height. */
interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What the current drag does: move the frame, or pull some of its edges. */
interface DragMode {
  move: boolean;
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

const INITIAL_FRAME: Frame = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
/** A touch this close to an edge (px) grabs that edge. */
const GRAB_DISTANCE = 28;
/** The frame cannot be made smaller than this (px), so it stays easy to grab. */
const MIN_FRAME_PX = 90;
/** Space kept free around the photo on screen (px). */
const AREA_MARGIN = 16;
const SHADE = 'rgba(0,0,0,0.55)';
const CORNER_LENGTH = 22;

export default function CropModal({
  visible,
  uri,
  onCancel,
  onApply,
  aspect,
  hint,
}: CropModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Mounted only while open, so every opening starts with a fresh frame. */}
      {visible ? (
        <CropEditor uri={uri} aspect={aspect} hint={hint} onCancel={onCancel} onApply={onApply} />
      ) : null}
    </Modal>
  );
}

function CropEditor({
  uri,
  aspect,
  hint,
  onCancel,
  onApply,
}: {
  uri: string;
  aspect?: number;
  hint?: string;
  onCancel: () => void;
  onApply: (croppedUri: string) => void;
}) {
  const { t } = useLanguage();

  // Room available for the photo, and the photo's own size.
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [frame, setFrame] = useState<Frame>(INITIAL_FRAME);
  const [isCropping, setIsCropping] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Image.getSize(
      uri,
      (width, height) => {
        if (!cancelled) setNatural({ width, height });
      },
      () => {
        if (!cancelled) setFailed(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [uri]);

  // The photo as drawn: as large as fits in the available room, same shape as the file.
  const shown = useMemo(() => {
    if (!area || !natural) return null;
    const scale = Math.min(
      (area.width - AREA_MARGIN * 2) / natural.width,
      (area.height - AREA_MARGIN * 2) / natural.height
    );
    if (!(scale > 0)) return null;
    return { width: natural.width * scale, height: natural.height * scale };
  }, [area, natural]);

  // What the touch handlers read. They are created once, so they look things
  // up here instead of closing over state that goes stale.
  const frameRef = useRef<Frame>(INITIAL_FRAME);
  const shownRef = useRef<{ width: number; height: number } | null>(null);
  const dragRef = useRef<{ mode: DragMode; start: Frame } | null>(null);
  const aspectRef = useRef(aspect);
  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);
  useEffect(() => {
    aspectRef.current = aspect;
  }, [aspect]);

  // With a locked shape the starting frame must already have that shape: the biggest
  // centered one that fits (80% of the photo), set once the photo's size on screen is known.
  const startedLocked = useRef(false);
  useLayoutEffect(() => {
    if (!aspect || !shown || startedLocked.current) return;
    startedLocked.current = true;

    const width = Math.min(shown.width * 0.8, shown.height * 0.8 * aspect);
    const height = width / aspect;
    const next: Frame = {
      x: (shown.width - width) / 2 / shown.width,
      y: (shown.height - height) / 2 / shown.height,
      w: width / shown.width,
      h: height / shown.height,
    };
    frameRef.current = next;
    setFrame(next);
  }, [aspect, shown]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (event) => {
          const size = shownRef.current;
          if (!size) return;
          const start = frameRef.current;
          const mode = pickDragMode(
            event.nativeEvent.locationX,
            event.nativeEvent.locationY,
            {
              x: start.x * size.width,
              y: start.y * size.height,
              w: start.w * size.width,
              h: start.h * size.height,
            }
          );
          dragRef.current = mode ? { mode, start } : null;
        },

        onPanResponderMove: (_event, gesture) => {
          const size = shownRef.current;
          const drag = dragRef.current;
          if (!size || !drag) return;

          const next = dragFrame(drag.start, drag.mode, gesture.dx, gesture.dy, size, aspectRef.current);
          frameRef.current = next;
          setFrame(next);
        },

        onPanResponderRelease: () => {
          dragRef.current = null;
        },
        onPanResponderTerminate: () => {
          dragRef.current = null;
        },
      }),
    []
  );

  function handleLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setArea({ width, height });
  }

  async function handleApply() {
    if (isCropping) return;
    setIsCropping(true);
    setFailed(false);

    // Loaded here, not at the top of the file, so a build without the native
    // module shows an error message instead of crashing the screen.
    let sourceRef: ImageRef | null = null;
    let croppedRef: ImageRef | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const manipulator = require('expo-image-manipulator') as typeof import('expo-image-manipulator');

      // Read the size the manipulator itself sees (it applies the photo's rotation
      // tag), so the frame is cut out of the same picture the farmer was looking at.
      const source = await manipulator.ImageManipulator.manipulate(uri).renderAsync();
      sourceRef = source;

      const f = frameRef.current;
      const originX = clampInt(Math.round(f.x * source.width), 0, source.width - 1);
      const originY = clampInt(Math.round(f.y * source.height), 0, source.height - 1);
      const width = clampInt(Math.round(f.w * source.width), 1, source.width - originX);
      // A locked shape is cut exactly to it (rounding the two sides separately can be 1px off).
      const height = clampInt(
        Math.round(aspect ? width / aspect : f.h * source.height),
        1,
        source.height - originY
      );

      const cropped = await manipulator.ImageManipulator.manipulate(source)
        .crop({ originX, originY, width, height })
        .renderAsync();
      croppedRef = cropped;

      const saved = await cropped.saveAsync({
        format: manipulator.SaveFormat.JPEG,
        compress: 0.92,
      });
      onApply(saved.uri);
    } catch (error) {
      console.warn('[crop] Could not crop the photo:', error);
      setFailed(true);
      setIsCropping(false);
    } finally {
      sourceRef?.release();
      croppedRef?.release();
    }
  }

  // Frame in screen pixels, for drawing.
  const box = shown
    ? {
        left: frame.x * shown.width,
        top: frame.y * shown.height,
        width: frame.w * shown.width,
        height: frame.h * shown.height,
      }
    : null;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-6 pb-2 pt-4">
        <Text className="text-xl font-bold text-white">{t.preview.cropTitle}</Text>
        <Text className="mt-1 text-sm text-gray-300">{hint ?? t.preview.cropHint}</Text>
        {failed && (
          <Text className="mt-2 text-sm text-red-400">{t.preview.cropError}</Text>
        )}
      </View>

      <View className="flex-1 items-center justify-center" onLayout={handleLayout}>
        {shown && box ? (
          <View style={{ width: shown.width, height: shown.height }} {...panResponder.panHandlers}>
            <View pointerEvents="none">
              <Image
                source={{ uri }}
                style={{ width: shown.width, height: shown.height }}
                resizeMode="stretch"
              />
            </View>

            {/* Dim everything outside the frame. */}
            <View
              pointerEvents="none"
              style={{ position: 'absolute', left: 0, top: 0, width: shown.width, height: box.top, backgroundColor: SHADE }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                top: box.top + box.height,
                width: shown.width,
                height: shown.height - box.top - box.height,
                backgroundColor: SHADE,
              }}
            />
            <View
              pointerEvents="none"
              style={{ position: 'absolute', left: 0, top: box.top, width: box.left, height: box.height, backgroundColor: SHADE }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: box.left + box.width,
                top: box.top,
                width: shown.width - box.left - box.width,
                height: box.height,
                backgroundColor: SHADE,
              }}
            />

            {/* The frame: outline, thirds guides and chunky corners to grab. */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.9)',
              }}
            >
              <GuideLine vertical position="33.33%" />
              <GuideLine vertical position="66.66%" />
              <GuideLine position="33.33%" />
              <GuideLine position="66.66%" />

              <Corner corner="tl" />
              <Corner corner="tr" />
              <Corner corner="bl" />
              <Corner corner="br" />
            </View>
          </View>
        ) : failed ? null : (
          <ActivityIndicator size="large" color="#ffffff" />
        )}
      </View>

      <View className="flex-row px-6 pb-6 pt-3">
        <Pressable
          onPress={onCancel}
          disabled={isCropping}
          className="mr-3 flex-1 items-center rounded-xl border-2 border-white py-4 active:bg-white/10"
        >
          <Text className="text-base font-semibold text-white">{t.preview.cropCancel}</Text>
        </Pressable>

        <Pressable
          onPress={handleApply}
          disabled={isCropping || !shown}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-4 ${
            isCropping || !shown ? 'bg-leaf-400' : 'bg-leaf-600 active:bg-leaf-700'
          }`}
        >
          {isCropping && <ActivityIndicator size="small" color="#ffffff" className="mr-2" />}
          <Text className="text-base font-semibold text-white">
            {isCropping ? t.preview.cropping : t.preview.cropApply}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** A thin line across the frame (a "rule of thirds" guide). */
function GuideLine({ vertical, position }: { vertical?: boolean; position: `${number}%` }) {
  return (
    <View
      pointerEvents="none"
      style={
        vertical
          ? { position: 'absolute', top: 0, bottom: 0, left: position, width: 1, backgroundColor: 'rgba(255,255,255,0.35)' }
          : { position: 'absolute', left: 0, right: 0, top: position, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' }
      }
    />
  );
}

/** A bold L-shaped mark on one corner of the frame. */
function Corner({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const top = corner === 'tl' || corner === 'tr';
  const left = corner === 'tl' || corner === 'bl';
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: CORNER_LENGTH,
        height: CORNER_LENGTH,
        ...(top ? { top: -2 } : { bottom: -2 }),
        ...(left ? { left: -2 } : { right: -2 }),
        borderColor: '#ffffff',
        borderTopWidth: top ? 4 : 0,
        borderBottomWidth: top ? 0 : 4,
        borderLeftWidth: left ? 4 : 0,
        borderRightWidth: left ? 0 : 4,
      }}
    />
  );
}

/**
 * Decides what a touch at (x, y) does, given the frame in pixels: pull the
 * nearest edge(s) when the touch is close to the border, move the whole frame
 * when it is well inside, nothing when it is outside.
 */
function pickDragMode(
  x: number,
  y: number,
  box: { x: number; y: number; w: number; h: number }
): DragMode | null {
  const toLeft = Math.abs(x - box.x);
  const toRight = Math.abs(x - (box.x + box.w));
  const toTop = Math.abs(y - box.y);
  const toBottom = Math.abs(y - (box.y + box.h));

  const alongX = x > box.x - GRAB_DISTANCE && x < box.x + box.w + GRAB_DISTANCE;
  const alongY = y > box.y - GRAB_DISTANCE && y < box.y + box.h + GRAB_DISTANCE;

  const left = alongY && toLeft <= GRAB_DISTANCE && toLeft <= toRight;
  const right = alongY && toRight <= GRAB_DISTANCE && toRight < toLeft;
  const top = alongX && toTop <= GRAB_DISTANCE && toTop <= toBottom;
  const bottom = alongX && toBottom <= GRAB_DISTANCE && toBottom < toTop;

  if (left || right || top || bottom) {
    return { move: false, left, right, top, bottom };
  }

  const inside = x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
  return inside ? { move: true, left: false, right: false, top: false, bottom: false } : null;
}

/**
 * The frame after dragging by (dx, dy) pixels, kept inside the photo and above the minimum size.
 * With `aspect` (width / height) the frame keeps that shape: the edge or corner being pulled sets
 * the size, and the opposite side stays where it is.
 */
function dragFrame(
  start: Frame,
  mode: DragMode,
  dx: number,
  dy: number,
  size: { width: number; height: number },
  aspect?: number
): Frame {
  const minW = Math.min(MIN_FRAME_PX, size.width);
  const minH = Math.min(MIN_FRAME_PX, size.height);

  let left = start.x * size.width;
  let top = start.y * size.height;
  let right = left + start.w * size.width;
  let bottom = top + start.h * size.height;

  if (mode.move) {
    const width = right - left;
    const height = bottom - top;
    left = clamp(left + dx, 0, size.width - width);
    top = clamp(top + dy, 0, size.height - height);
    right = left + width;
    bottom = top + height;
  } else if (aspect) {
    // Size the frame is being pulled to, from the side(s) that moved.
    const wantW = mode.left ? right - (left + dx) : mode.right ? right + dx - left : null;
    const wantH = mode.top ? bottom - (top + dy) : mode.bottom ? bottom + dy - top : null;
    let width =
      wantW !== null && wantH !== null
        ? Math.max(wantW, wantH * aspect) // a corner follows whichever side was pulled further
        : wantW ?? (wantH ?? right - left) * aspect;

    // Room the frame has to grow into: up to the photo's edge on the pulled side, or
    // equally on both sides when only the other axis was pulled (it stays centered).
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;
    const roomW = mode.left
      ? right
      : mode.right
        ? size.width - left
        : 2 * Math.min(centerX, size.width - centerX);
    const roomH = mode.top
      ? bottom
      : mode.bottom
        ? size.height - top
        : 2 * Math.min(centerY, size.height - centerY);

    const maxWidth = Math.min(roomW, roomH * aspect);
    const minWidth = Math.min(Math.max(minW, minH * aspect), maxWidth);
    width = clamp(width, minWidth, maxWidth);
    const height = width / aspect;

    if (mode.left) left = right - width;
    else if (mode.right) right = left + width;
    else {
      left = centerX - width / 2;
      right = left + width;
    }
    if (mode.top) top = bottom - height;
    else if (mode.bottom) bottom = top + height;
    else {
      top = centerY - height / 2;
      bottom = top + height;
    }
  } else {
    if (mode.left) left = clamp(left + dx, 0, right - minW);
    if (mode.right) right = clamp(right + dx, left + minW, size.width);
    if (mode.top) top = clamp(top + dy, 0, bottom - minH);
    if (mode.bottom) bottom = clamp(bottom + dy, top + minH, size.height);
  }

  return {
    x: left / size.width,
    y: top / size.height,
    w: (right - left) / size.width,
    h: (bottom - top) / size.height,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(Math.floor(value), Math.max(min, max)));
}
