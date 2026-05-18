import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

type OrbProps = {
  x: number;
  y: number;
  size: number;
  colors: [string, string];
};

function StaticOrb({ x, y, size, colors }: OrbProps) {
  return (
    <View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        opacity: 0.4,
      }}
    >
      <LinearGradient colors={colors} style={{ flex: 1, borderRadius: size / 2 }} />
    </View>
  );
}

export function AtmosphericBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
      <StaticOrb
        x={width * 0.15}
        y={height * 0.2}
        size={320}
        colors={['rgba(211,188,252,0.18)', 'transparent']}
      />
      <StaticOrb
        x={width * 0.85}
        y={height * 0.15}
        size={280}
        colors={['rgba(255,188,208,0.15)', 'transparent']}
      />
      <StaticOrb
        x={width * 0.5}
        y={height * 0.78}
        size={360}
        colors={['rgba(242,202,80,0.10)', 'transparent']}
      />
    </View>
  );
}
