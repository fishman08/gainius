import React from 'react';
import { ActivityIndicator, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ChatScreen from '../screens/ChatScreen';
import { HomeScreen } from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import { useAuth } from '../providers/AuthProvider';
import { useAppTheme } from '../providers/ThemeProvider';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_DEFS = [
  { name: 'Chat', label: 'Chat', icon: 'chat', iconOutline: 'chat-outline' },
  { name: 'Workout', label: 'Workout', icon: 'dumbbell', iconOutline: 'dumbbell' },
  { name: 'Progress', label: 'Progress', icon: 'chart-line', iconOutline: 'chart-line-variant' },
  { name: 'Settings', label: 'More', icon: 'cog', iconOutline: 'cog-outline' },
] as const;

function PulseTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.navBar,
          borderTopColor: theme.colors.surfaceBorder,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tab = TAB_DEFS[index];
        const color = isFocused ? theme.colors.primary : 'rgba(255,255,255,0.3)';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tabItem}
          >
            {isFocused && (
              <View style={[styles.topIndicator, { backgroundColor: theme.colors.primary }]} />
            )}
            <MaterialCommunityIcons
              name={(isFocused ? tab.icon : tab.iconOutline) as never}
              size={22}
              color={color}
            />
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  const { theme } = useAppTheme();

  return (
    <Tab.Navigator
      id="MainTabs"
      tabBar={(props) => <PulseTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.navBar },
        headerTintColor: theme.colors.navBarText,
      }}
    >
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'AI Coach', headerShown: false }}
      />
      <Tab.Screen
        name="Workout"
        component={HomeScreen}
        options={{ title: 'Workout', headerShown: false }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: 'Progress', headerShown: false }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { theme } = useAppTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
  },
  topIndicator: {
    position: 'absolute',
    top: 0,
    width: '50%',
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tabLabel: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 10,
  },
});
