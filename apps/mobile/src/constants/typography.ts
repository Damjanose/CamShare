import { TextStyle } from 'react-native';

export const FontFamily = {
  playfair: 'PlayfairDisplay_700Bold',
  playfairItalic: 'PlayfairDisplay_700Bold_Italic',
  playfairSemiBold: 'PlayfairDisplay_600SemiBold',
  playfairMedium: 'PlayfairDisplay_500Medium',
  dmSans: 'DMSans_400Regular',
  dmSansMedium: 'DMSans_500Medium',
  dmSansBold: 'DMSans_700Bold',
} as const;

export const TextStyles = {
  headlineXl: {
    fontFamily: FontFamily.playfair,
    fontSize: 42,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 46,
    letterSpacing: -0.84,
  } satisfies TextStyle,

  headlineXlItalic: {
    fontFamily: FontFamily.playfairItalic,
    fontSize: 42,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 46,
    letterSpacing: -0.84,
  } satisfies TextStyle,

  headlineLg: {
    fontFamily: FontFamily.playfairSemiBold,
    fontSize: 32,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 38,
  } satisfies TextStyle,

  headlineLgMobile: {
    fontFamily: FontFamily.playfairSemiBold,
    fontSize: 28,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 34,
  } satisfies TextStyle,

  headlineMd: {
    fontFamily: FontFamily.playfairMedium,
    fontSize: 24,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 31,
  } satisfies TextStyle,

  bodyLg: {
    fontFamily: FontFamily.dmSans,
    fontSize: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 29,
  } satisfies TextStyle,

  bodyMd: {
    fontFamily: FontFamily.dmSans,
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 24,
  } satisfies TextStyle,

  labelMd: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: 14,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 20,
    letterSpacing: 0.7,
  } satisfies TextStyle,

  labelSm: {
    fontFamily: FontFamily.dmSansBold,
    fontSize: 12,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 14,
    letterSpacing: 1.2,
  } satisfies TextStyle,
} as const;
