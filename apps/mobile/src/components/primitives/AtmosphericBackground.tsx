import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

type OrbProps = {
  x: number;
  y: number;
  size: number;
  colors: [string, string];
  delay?: number;
};

function AnimatedOrb({ x, y, size, colors, delay = 0 }: OrbProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const makeLoop = (anim: Animated.Value, toA: number, toB: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: toA, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true, delay }),
          Animated.timing(anim, { toValue: toB, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );

    const x$ = makeLoop(translateX, 20, -20, 4000 + delay);
    const y$ = makeLoop(translateY, -15, 15, 3500 + delay);
    const o$ = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 2500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );

    x$.start();
    y$.start();
    o$.start();

    return () => { x$.stop(); y$.stop(); o$.stop(); };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        transform: [{ translateX }, { translateY }],
        opacity,
      }}
    >
      <LinearGradient colors={colors} style={{ flex: 1, borderRadius: size / 2 }} />
    </Animated.View>
  );
}

export function AtmosphericBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
      <AnimatedOrb
        x={width * 0.15}
        y={height * 0.2}
        size={320}
        colors={['rgba(211,188,252,0.18)', 'transparent']}
        delay={0}
      />
      <AnimatedOrb
        x={width * 0.85}
        y={height * 0.15}
        size={280}
        colors={['rgba(255,188,208,0.15)', 'transparent']}
        delay={800}
      />
      <AnimatedOrb
        x={width * 0.5}
        y={height * 0.78}
        size={360}
        colors={['rgba(242,202,80,0.10)', 'transparent']}
        delay={400}
      />
    </View>
  );
}
