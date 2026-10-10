import { useColorScheme } from 'react-native';

const light = {
  bg: '#FFFFFF', card: '#F2F4F7', text: '#0F1419', muted: '#6B7480', border: '#E3E7EC',
  accent: '#2F80ED', onAccent: '#FFFFFF', bubbleMine: '#2F80ED', bubbleTheirs: '#EEF1F5',
  textMine: '#FFFFFF', danger: '#E5484D',
};
const dark: typeof light = {
  bg: '#0E1116', card: '#171B22', text: '#F2F4F7', muted: '#8A94A3', border: '#242A33',
  accent: '#4C9AFF', onAccent: '#FFFFFF', bubbleMine: '#2F80ED', bubbleTheirs: '#1E242D',
  textMine: '#FFFFFF', danger: '#FF6369',
};

export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);
