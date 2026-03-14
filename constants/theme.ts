/**
 * Paleta de cores do app para modo claro e escuro.
 * Cores harmoniosas e consistentes em ambos os temas.
 */

import { Platform } from 'react-native';

// Laranja principal da marca - vibrante e legível em ambos os temas
const primaryOrange = '#E85D2C';
const primaryOrangeDark = '#F07040';

export const Colors = {
  light: {
    text: '#1A1D21',
    textSecondary: '#5C6369',
    background: '#FAFBFC',
    menuBackground: '#F0F2F5',
    tint: primaryOrange,
    icon: '#6B7280',
    tabIconDefault: '#8B9199',
    tabIconSelected: primaryOrange,
    border: '#E5E7EB',
    borderFocus: '#D1D5DB',
    primary: primaryOrange,
    onPrimary: '#FFFFFF',
    secondary: '#6B7280',
    rating: '#F59E0B',
  },
  dark: {
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    background: '#0F1419',
    menuBackground: '#1A1F26',
    tint: primaryOrangeDark,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: primaryOrangeDark,
    border: '#374151',
    borderFocus: '#4B5563',
    primary: primaryOrangeDark,
    onPrimary: '#FFFFFF',
    secondary: '#9CA3AF',
    rating: '#FBBF24',
  },
};

export const BOOK_COVER_COLORS = [
  '#8B7355',
  '#6B5344',
  '#4B3324',
  '#2B1304',
  '#0B0304',
  '#5C4033',
  '#3D2817',
  '#8B4513',
  '#654321',
  '#A0522D',
];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
