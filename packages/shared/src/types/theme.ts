export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  primaryText: string;
  background: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  textSecondary: string;
  textHint: string;
  success: string;
  error: string;
  navBar: string;
  navBarText: string;
  navBarActive: string;
  messageBubbleUser: string;
  messageBubbleUserText: string;
  messageBubbleAI: string;
  messageBubbleAIText: string;
  inputBackground: string;
  inputBorder: string;
  accent: string;
  surfaceElevated: string;
  primaryMuted: string;
  gradient1: string;
  gradient2: string;
}

export interface ThemeTypography {
  display: { fontFamily: string; fontWeight: number; fontSize: number };
  headline: { fontFamily: string; fontWeight: number; fontSize: number };
  title: { fontFamily: string; fontWeight: number; fontSize: number };
  body: { fontFamily: string; fontWeight: number; fontSize: number };
  label: { fontFamily: string; fontWeight: number; fontSize: number };
  caption: { fontFamily: string; fontWeight: number; fontSize: number };
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: ThemeTypography;
  shadows: ThemeShadows;
}

const FONT_DISPLAY = "'Barlow Condensed', sans-serif";
const FONT_BODY = "'Rethink Sans', sans-serif";

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#F97316',
    primaryText: '#0F172A',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceBorder: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#64748B',
    textHint: '#94A3B8',
    success: '#22C55E',
    error: '#EF4444',
    navBar: '#0F172A',
    navBarText: '#F8FAFC',
    navBarActive: '#F97316',
    messageBubbleUser: '#F97316',
    messageBubbleUserText: '#ffffff',
    messageBubbleAI: '#F1F5F9',
    messageBubbleAIText: '#0F172A',
    inputBackground: '#ffffff',
    inputBorder: '#E2E8F0',
    accent: '#22C55E',
    surfaceElevated: '#FFFFFF',
    primaryMuted: '#FFF7ED',
    gradient1: '#F97316',
    gradient2: '#FB923C',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 8, md: 14, lg: 20, xl: 28, full: 9999 },
  typography: {
    display: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 32 },
    headline: { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 24 },
    title: { fontFamily: FONT_BODY, fontWeight: 600, fontSize: 18 },
    body: { fontFamily: FONT_BODY, fontWeight: 400, fontSize: 16 },
    label: { fontFamily: FONT_BODY, fontWeight: 500, fontSize: 14 },
    caption: { fontFamily: FONT_BODY, fontWeight: 400, fontSize: 12 },
  },
  shadows: {
    sm: '0 1px 3px rgba(15,23,42,0.08)',
    md: '0 4px 12px rgba(15,23,42,0.10)',
    lg: '0 8px 24px rgba(15,23,42,0.12)',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#FB923C',
    primaryText: '#ffffff',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceBorder: '#334155',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textHint: '#64748B',
    success: '#4ADE80',
    error: '#F87171',
    navBar: '#1E293B',
    navBarText: '#F1F5F9',
    navBarActive: '#FB923C',
    messageBubbleUser: '#FB923C',
    messageBubbleUserText: '#0F172A',
    messageBubbleAI: '#1E293B',
    messageBubbleAIText: '#F1F5F9',
    inputBackground: '#1E293B',
    inputBorder: '#334155',
    accent: '#4ADE80',
    surfaceElevated: '#334155',
    primaryMuted: '#431407',
    gradient1: '#FB923C',
    gradient2: '#FDBA74',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 8, md: 14, lg: 20, xl: 28, full: 9999 },
  typography: {
    display: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 32 },
    headline: { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 24 },
    title: { fontFamily: FONT_BODY, fontWeight: 600, fontSize: 18 },
    body: { fontFamily: FONT_BODY, fontWeight: 400, fontSize: 16 },
    label: { fontFamily: FONT_BODY, fontWeight: 500, fontSize: 14 },
    caption: { fontFamily: FONT_BODY, fontWeight: 400, fontSize: 12 },
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.2)',
    md: '0 4px 12px rgba(0,0,0,0.25)',
    lg: '0 8px 24px rgba(0,0,0,0.3)',
  },
};
