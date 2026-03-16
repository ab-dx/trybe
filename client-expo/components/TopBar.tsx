import { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Image,
	Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth/AuthContext";
import { useFonts, Montserrat_400Regular } from "@expo-google-fonts/montserrat";

export const TopBar: React.FC = () => {
	const { user, logout } = useAuth();
	const [showDropdown, setShowDropdown] = useState(false);
	const [loaded] = useFonts({
		Montserrat_400Regular,
	});

	const getInitial = (email: string | null | undefined): string => {
		if (!email) return "?";
		return email.charAt(0).toUpperCase();
	};

	const handleLogout = async () => {
		setShowDropdown(false);
		try {
			await logout();
		} catch {
			// Error handled by AuthContext
		}
	};

	const renderAvatar = () => {
		if (user?.photoURL) {
			return (
				<Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
			);
		}
		return (
			<View style={styles.avatarPlaceholder}>
				<Text style={styles.avatarText}>{getInitial(user?.email)}</Text>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>TRYBE</Text>

			<View style={styles.profileContainer}>
				<TouchableOpacity
					style={styles.profileButton}
					onPress={() => setShowDropdown(!showDropdown)}
					activeOpacity={0.7}
				>
					{renderAvatar()}
				</TouchableOpacity>

				{showDropdown && (
					<View style={styles.dropdown}>
						<View style={styles.dropdownHeader}>
							<Text style={styles.dropdownEmail}>{user?.email}</Text>
						</View>
						<TouchableOpacity
							style={styles.dropdownItem}
							onPress={handleLogout}
						>
							<Ionicons name="log-out-outline" size={20} color="#ef4444" />
							<Text style={styles.dropdownText}>Sign Out</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>

			{showDropdown && (
				<Pressable
					style={styles.overlay}
					onPress={() => setShowDropdown(false)}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#080e1f",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#1e293b",
		zIndex: 1000,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
		fontFamily: "Montserrat_400Regular",
	},
	profileContainer: {
		position: "relative",
	},
	profileButton: {
		padding: 2,
	},
	avatarImage: {
		width: 36,
		height: 36,
		borderRadius: 18,
	},
	avatarPlaceholder: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#334155",
		justifyContent: "center",
		alignItems: "center",
	},
	avatarText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	dropdown: {
		position: "absolute",
		top: 44,
		right: 0,
		backgroundColor: "#1e293b",
		borderRadius: 8,
		width: 200,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
		zIndex: 1000,
	},
	dropdownHeader: {
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#334155",
	},
	dropdownEmail: {
		color: "#9ca3af",
		fontSize: 14,
	},
	dropdownItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		gap: 8,
	},
	dropdownText: {
		color: "#ef4444",
		fontSize: 16,
	},
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 50,
	},
});
