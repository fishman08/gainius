import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { store } from './src/store';
import { StorageProvider } from './src/providers/StorageProvider';
import { AuthProvider } from './src/providers/AuthProvider';
import { SyncProvider } from './src/providers/SyncProvider';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
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
      <PaperProvider>
        <AuthProvider>
          <StorageProvider>
            <SyncProvider>
              <RootNavigator />
            </SyncProvider>
          </StorageProvider>
        </AuthProvider>
      </PaperProvider>
    </Provider>
  );
}
