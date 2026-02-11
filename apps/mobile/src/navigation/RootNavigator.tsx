import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ChatScreen from '../screens/ChatScreen';
import { HomeScreen } from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import { useAuth } from '../providers/AuthProvider';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabIcons: Record<string, { focused: string; unfocused: string }> = {
  Chat: { focused: 'chatbubbles', unfocused: 'chatbubbles-outline' },
  Workout: { focused: 'barbell', unfocused: 'barbell-outline' },
  Progress: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIcons[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName as never} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#999',
        headerStyle: { backgroundColor: '#4A90E2' },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'AI Coach' }} />
      <Tab.Screen name="Workout" component={HomeScreen} options={{ title: 'Workout' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animationTypeForReplace: 'pop' }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
