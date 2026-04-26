import { useState } from "react";
import { View, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import {
	PlusJakartaSans_400Regular,
	PlusJakartaSans_500Medium,
	PlusJakartaSans_600SemiBold,
	PlusJakartaSans_700Bold,
	PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
	Inter_400Regular,
	Inter_500Medium,
	Inter_600SemiBold,
	Inter_700Bold,
} from "@expo-google-fonts/inter";

import { AuthProvider, useAuth } from "lib/auth/AuthContext";
import { LoginScreen } from "components/LoginScreen";
import { SignupScreen } from "components/SignupScreen";
import { StatusBar } from "components/StatusBar";
import { TopBar } from "components/TopBar";
import { FeedScreen } from "screens/FeedScreen";
import { MapScreen } from "screens/MapScreen";
import { ActivityScreen } from "screens/ActivityScreen";
import { ProfileScreen } from "screens/ProfileScreen";

type TabName = "Feed" | "Map" | "Activity" | "Profile";
type AuthScreen = "login" | "signup";

const MainApp: React.FC = () => {
	const { user, isLoading, showAuthModal, closeAuthModal } = useAuth();
	const [activeTab, setActiveTab] = useState<TabName>("Feed");
	const [authScreen, setAuthScreen] = useState<AuthScreen>("login");

	const [mapFocus, setMapFocus] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);

	const [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold,
		PlusJakartaSans_800ExtraBold,
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold,
		Inter_700Bold,
	});

	const handleJumpToMap = (latitude: number, longitude: number) => {
		setMapFocus({ latitude, longitude });
		setActiveTab("Map");
	};

	const renderScreen = () => {
		switch (activeTab) {
			case "Feed":
				// Pass the jump function to the Feed
				return <FeedScreen onJumpToMap={handleJumpToMap} />;
			case "Map":
				// Pass the focus coordinates to the MapScreen
				return (
					<MapScreen
						initialRegion={mapFocus}
						onMapMoved={() => setMapFocus(null)}
					/>
				);
			case "Activity":
				return <ActivityScreen />;
			case "Profile":
				return <ProfileScreen />;
		}
	};

	if (isLoading || !fontsLoaded) {
		return null;
	}

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.mainContent}>
                    <TopBar />
                    <View style={styles.screenContainer}>{renderScreen()}</View>
                    <StatusBar activeTab={activeTab} onTabPress={setActiveTab} />
                </View>

                <ExpoStatusBar style="dark" />

                <Modal 
                    visible={showAuthModal} 
                    animationType="slide" 
                    presentationStyle="pageSheet"
                    onRequestClose={closeAuthModal}
                >
                    <View style={styles.modalContainer}>
                        <TouchableOpacity style={styles.closeButton} onPress={closeAuthModal}>
                            <Ionicons name="close" size={28} color="#7e766e" />
                        </TouchableOpacity>

                        {authScreen === "login" ? (
                            <LoginScreen onNavigateToSignup={() => setAuthScreen("signup")} />
                        ) : (
                            <SignupScreen onNavigateToLogin={() => setAuthScreen("login")} />
                        )}
                    </View>
                </Modal>
			</SafeAreaView>
		</SafeAreaProvider>
	);
};

export default function App() {
	return (
		<AuthProvider>
			<MainApp />
		</AuthProvider>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#D8CFC0" },
    mainContent: { flex: 1 },
    screenContainer: { flex: 1 },
    modalContainer: {
        flex: 1,
        backgroundColor: "#D8CFC0",
    },
    closeButton: {
        position: "absolute",
        top: 20,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
});
