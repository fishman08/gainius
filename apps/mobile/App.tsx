import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  RethinkSans_400Regular,
  RethinkSans_500Medium,
  RethinkSans_600SemiBold,
  RethinkSans_700Bold,
} from '@expo-google-fonts/rethink-sans';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { StorageProvider } from './src/providers/StorageProvider';
import { AuthProvider } from './src/providers/AuthProvider';
import { SyncProvider } from './src/providers/SyncProvider';
import { ThemeProvider } from './src/providers/ThemeProvider';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
    RethinkSans_400Regular,
    RethinkSans_500Medium,
    RethinkSans_600SemiBold,
    RethinkSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <StorageProvider>
            <SyncProvider>
              <RootNavigator />
            </SyncProvider>
          </StorageProvider>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}
