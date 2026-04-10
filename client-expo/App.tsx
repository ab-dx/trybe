import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useFonts } from "expo-font";

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
	const { user, isLoading } = useAuth();
	const [activeTab, setActiveTab] = useState<TabName>("Feed");
	const [authScreen, setAuthScreen] = useState<AuthScreen>("login");

	const renderScreen = () => {
		switch (activeTab) {
			case "Feed":
				return <FeedScreen />;
			case "Map":
				return <MapScreen />;
			case "Activity":
				return <ActivityScreen />;
			case "Profile":
				return <ProfileScreen />;
		}
	};

	if (isLoading) {
		return null;
	}

	return (
		<SafeAreaProvider>
			<SafeAreaView style={styles.container} edges={["top"]}>
				{!user ? (
					authScreen === "login" ? (
						<LoginScreen onNavigateToSignup={() => setAuthScreen("signup")} />
					) : (
						<SignupScreen onNavigateToLogin={() => setAuthScreen("login")} />
					)
				) : (
					<View style={styles.mainContent}>
						<TopBar />
						<View style={styles.screenContainer}>{renderScreen()}</View>
						<StatusBar activeTab={activeTab} onTabPress={setActiveTab} />
					</View>
				)}
				<ExpoStatusBar style={user ? "light" : "auto"} />
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
	container: {
		flex: 1,
		backgroundColor: "#080e1f",
	},
	mainContent: {
		flex: 1,
	},
	screenContainer: {
		flex: 1,
	},
});
