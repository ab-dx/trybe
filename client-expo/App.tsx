import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LoginScreen } from 'components/LoginScreen';
import { StatusBar } from 'components/StatusBar';
import { FeedScreen } from 'screens/FeedScreen';
import { MapScreen } from 'screens/MapScreen';
import { ActivityScreen } from 'screens/ActivityScreen';

type TabName = 'Feed' | 'Map' | 'Activity';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>('Feed');

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = await AsyncStorage.getItem('isLoggedIn');
      setIsLoggedIn(loggedIn === 'true');
      setIsLoading(false);
    };
    checkLoginStatus();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'Feed':
        return <FeedScreen />;
      case 'Map':
        return <MapScreen />;
      case 'Activity':
        return <ActivityScreen />;
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        {!isLoggedIn ? (
          <LoginScreen onLogin={handleLogin} />
        ) : (
          <View style={styles.mainContent}>
            <View style={styles.screenContainer}>{renderScreen()}</View>
            <StatusBar activeTab={activeTab} onTabPress={setActiveTab} />
          </View>
        )}
        <ExpoStatusBar style={isLoggedIn ? 'light' : 'auto'} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080e1f',
  },
  mainContent: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
