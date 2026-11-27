/**
 * src/components/auth/AuthBackground.tsx
 *
 * Ambient background for sign-in / registration screens:
 *   1. Aurora — three large, soft radial glows (blue / indigo / teal) drifting slowly.
 *   2. Research network — faint nodes + links in the header area, in two layers
 *      that drift at different speeds (parallax), with a few nodes softly pulsing.
 *   3. A fade into the page colour so the form area stays clean and readable.
 *
 * Performance / accessibility:
 *   - Only transform + opacity are animated, on the native driver.
 *   - Static when "Reduce Motion" is on, while the screen is not focused, or when
 *     the app is in the background (`animated={false}` forces static).
 *   - pointerEvents="none" and hidden from screen readers.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

// ---------------------------------------------------------------------------
// Network geometry (viewBox 360 x 300). Two layers move independently, so each
// layer only links its own nodes — links never detach from their dots.
// ---------------------------------------------------------------------------
type Node = [number, number, number]; // x, y, radius
const LAYER_A: { nodes: Node[]; links: [number, number][] } = {
  nodes: [[34, 58, 3], [96, 34, 2.5], [150, 86, 3.5], [214, 46, 2.5], [278, 92, 3], [330, 52, 2.5], [120, 150, 2.5], [250, 160, 3]],
  links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [4, 7], [6, 7]],
};
const LAYER_B: { nodes: Node[]; links: [number, number][] } = {
  nodes: [[18, 132, 2], [70, 110, 2.5], [188, 128, 2], [306, 132, 2.5], [348, 178, 2], [60, 200, 2], [170, 214, 2.5], [292, 226, 2]],
  links: [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [2, 6]],
};
/** Nodes that softly "ping" (in viewBox units). */
const PULSES: [number, number, number][] = [[150, 86, 0], [278, 92, 1400], [70, 110, 2800]];

const VB_W = 360;
const VB_H = 300;

/** Is ambient motion allowed right now? (Reduce Motion, focus, app state) */
function useAmbientMotion(requested: boolean) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [focused, setFocused] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const a = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const b = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  return requested && !reduceMotion && focused && active;
}

/** Endless back-and-forth 0 → 1 → 0 driver. */
function useOscillator(duration: number, run: boolean, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!run) {
      v.stopAnimation();
      return;
    }
    const half = duration / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: half, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [run, duration, delay, v]);
  return v;
}

/** A ping that repeats: scale up + fade out. */
function usePulse(run: boolean, delay: number) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!run) {
      v.stopAnimation();
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(4200 - delay),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [run, delay, v]);
  return v;
}

const Glow: React.FC<{ id: string; size: number; color: string; opacity: number }> = ({ id, size, color, opacity }) => (
  <Svg width={size} height={size}>
    <Defs>
      <RadialGradient id={id} cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={color} stopOpacity={opacity} />
        <Stop offset="0.55" stopColor={color} stopOpacity={opacity * 0.35} />
        <Stop offset="1" stopColor={color} stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
  </Svg>
);

const NetworkLayer: React.FC<{ layer: typeof LAYER_A; w: number; h: number; color: string; nodeOpacity: number; linkOpacity: number }> = ({
  layer,
  w,
  h,
  color,
  nodeOpacity,
  linkOpacity,
}) => (
  <Svg width={w} height={h} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice">
    {layer.links.map(([a, b]) => (
      <Line
        key={`${a}-${b}`}
        x1={layer.nodes[a][0]}
        y1={layer.nodes[a][1]}
        x2={layer.nodes[b][0]}
        y2={layer.nodes[b][1]}
        stroke={color}
        strokeOpacity={linkOpacity}
        strokeWidth={0.8}
      />
    ))}
    {layer.nodes.map(([x, y, r], i) => (
      <Circle key={i} cx={x} cy={y} r={r} fill={color} fillOpacity={nodeOpacity} />
    ))}
  </Svg>
);

const PulseDot: React.FC<{ x: number; y: number; delay: number; run: boolean; color: string }> = ({ x, y, delay, run, color }) => {
  const p = usePulse(run, delay);
  const size = 22;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        opacity: p.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] }),
        transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.6] }) }],
      }}
    />
  );
};

export interface AuthBackgroundProps {
  /** Set false for long forms (static, no motion). */
  animated?: boolean;
  /** Fade the lower part into the page colour (keeps forms clean). Default true. */
  fade?: boolean;
}

export const AuthBackground: React.FC<AuthBackgroundProps> = ({ animated = true, fade = true }) => {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const run = useAmbientMotion(animated);

  // Aurora drivers (slow, out of phase)
  const g1 = useOscillator(18000, run);
  const g2 = useOscillator(23000, run, 1500);
  const g3 = useOscillator(27000, run, 3000);
  // Network parallax drivers
  const nA = useOscillator(16000, run);
  const nB = useOscillator(21000, run, 2000);

  const palette = useMemo(
    () =>
      isDark
        ? { blue: '#3B82F6', indigo: '#6366F1', teal: '#14B8A6', glow: 0.32, net: '#93C5FD', node: 0.55, link: 0.22 }
        : { blue: '#60A5FA', indigo: '#818CF8', teal: '#2DD4BF', glow: 0.38, net: colors.primary, node: 0.35, link: 0.16 },
    [isDark, colors.primary],
  );

  const glow = Math.max(width, 360) * 1.15;
  const netH = Math.min(height * 0.46, 380);
  const scaleX = width / VB_W;
  const scaleY = netH / VB_H;
  const s = Math.max(scaleX, scaleY); // matches preserveAspectRatio="slice"
  const offX = (width - VB_W * s) / 2;
  const offY = (netH - VB_H * s) / 2;

  const drift = (v: Animated.Value, dx: number, dy: number) => ({
    transform: [
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-dx, dx] }) },
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-dy, dy] }) },
    ],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* 1. Aurora */}
      <Animated.View style={[styles.abs, { left: -glow * 0.35, top: -glow * 0.45 }, drift(g1, 28, 18)]}>
        <Glow id="auraBlue" size={glow} color={palette.blue} opacity={palette.glow} />
      </Animated.View>
      <Animated.View style={[styles.abs, { right: -glow * 0.45, top: -glow * 0.3 }, drift(g2, -24, 22)]}>
        <Glow id="auraIndigo" size={glow * 0.9} color={palette.indigo} opacity={palette.glow * 0.85} />
      </Animated.View>
      <Animated.View style={[styles.abs, { left: -glow * 0.25, top: height * 0.18 }, drift(g3, 22, -16)]}>
        <Glow id="auraTeal" size={glow * 0.75} color={palette.teal} opacity={palette.glow * 0.6} />
      </Animated.View>

      {/* 2. Research network (header area) */}
      <View style={[styles.abs, { left: 0, top: 0, width, height: netH }]}>
        <Animated.View style={[StyleSheet.absoluteFill, drift(nB, 6, 4)]}>
          <NetworkLayer layer={LAYER_B} w={width} h={netH} color={palette.net} nodeOpacity={palette.node * 0.7} linkOpacity={palette.link * 0.8} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, drift(nA, -10, 6)]}>
          <NetworkLayer layer={LAYER_A} w={width} h={netH} color={palette.net} nodeOpacity={palette.node} linkOpacity={palette.link} />
          {PULSES.map(([x, y, d]) => (
            <PulseDot key={`${x}-${y}`} x={offX + x * s} y={offY + y * s} delay={d} run={run} color={palette.net} />
          ))}
        </Animated.View>
      </View>

      {/* 3. Fade into the page colour below the header */}
      {fade ? (
        <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
          <Defs>
            <LinearGradient id="authFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.background} stopOpacity={0} />
              <Stop offset="0.3" stopColor={colors.background} stopOpacity={0} />
              <Stop offset="0.58" stopColor={colors.background} stopOpacity={0.9} />
              <Stop offset="1" stopColor={colors.background} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height} fill="url(#authFade)" />
        </Svg>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
