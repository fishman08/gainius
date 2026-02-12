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
  };
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#4A90E2',
    primaryText: '#ffffff',
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceBorder: '#dddddd',
    text: '#333333',
    textSecondary: '#666666',
    textHint: '#999999',
    success: '#198754',
    error: '#dc3545',
    navBar: '#4A90E2',
    navBarText: '#ffffff',
    navBarActive: '#ffffff',
    messageBubbleUser: '#4A90E2',
    messageBubbleUserText: '#ffffff',
    messageBubbleAI: '#E8E8E8',
    messageBubbleAIText: '#333333',
    inputBackground: '#ffffff',
    inputBorder: '#dddddd',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 18 },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#5BA3FF',
    primaryText: '#ffffff',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceBorder: '#333333',
    text: '#E0E0E0',
    textSecondary: '#B0B0B0',
    textHint: '#808080',
    success: '#66BB6A',
    error: '#EF5350',
    navBar: '#1E1E1E',
    navBarText: '#E0E0E0',
    navBarActive: '#5BA3FF',
    messageBubbleUser: '#5BA3FF',
    messageBubbleUserText: '#ffffff',
    messageBubbleAI: '#2A2A2A',
    messageBubbleAIText: '#E0E0E0',
    inputBackground: '#1E1E1E',
    inputBorder: '#333333',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 18 },
};
