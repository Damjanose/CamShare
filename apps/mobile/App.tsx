import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavTab } from './src/components/navigation/BottomNav';
import { Colors } from './src/constants/colors';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { useAuthStore } from './src/stores/authStore';
import { useSocketLifecycle } from './src/hooks/useSocketLifecycle';
import { GalleryScreen } from './src/screens/GalleryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

/** Authenticated screen stack — manages tab state centrally */
function MainNavigator() {
  const [activeTab, setActiveTab] = useState<NavTab>('Home');

  const handleTabPress = useCallback((tab: NavTab, navigation: any) => {
    if (tab === 'Scanner') {
      navigation.navigate('Scanner');
      return;
    }
    if (tab === 'Gallery') {
      navigation.navigate('Gallery', { eventTitle: 'All Photos' });
      return;
    }
    if (tab === 'Profile') {
      navigation.navigate('Profile');
      return;
    }
    if (tab === 'Home') {
      navigation.navigate('Home');
      return;
    }
    // Favorites — placeholder
    navigation.navigate('Home');
  }, []);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Home">
        {(props) => (
          <HomeScreen
            {...props}
            activeTab={activeTab}
            onTabPress={(tab) => {
              setActiveTab(tab);
              handleTabPress(tab, props.navigation);
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Gallery">
        {(props) => (
          <GalleryScreen
            {...props}
            activeTab={activeTab}
            onTabPress={(tab) => {
              setActiveTab(tab);
              handleTabPress(tab, props.navigation);
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Scanner">
        {(props) => (
          <ScannerScreen
            {...(props as any)}
            activeTab={activeTab}
            onTabPress={(tab) => {
              setActiveTab(tab);
              handleTabPress(tab, props.navigation);
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Profile">
        {(props) => (
          <ProfileScreen
            {...(props as any)}
            activeTab={activeTab}
            onTabPress={(tab) => {
              setActiveTab(tab);
              handleTabPress(tab, props.navigation);
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {user ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

function AppContent() {
  const sessionReady = useAuthStore((s) => s.sessionReady);
  useSocketLifecycle();

  if (!sessionReady) {
    return <View style={{ flex: 1, backgroundColor: Colors.surface }} />;
  }

  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style="light" backgroundColor="transparent" translucent />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.surface }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
