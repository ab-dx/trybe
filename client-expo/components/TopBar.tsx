import { useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Image,
	Pressable,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../lib/auth/AuthContext";

export const TopBar: React.FC = () => {
	const { user, logout } = useAuth();
	const [showDropdown, setShowDropdown] = useState(false);

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
			<TouchableOpacity activeOpacity={0.7}>
				<MaterialIcons name="help-outline" size={24} color="#38322C" />
			</TouchableOpacity>

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
							<Ionicons name="log-out-outline" size={20} color="#ba1a1a" />
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
		backgroundColor: "#D8CFC0",
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(56, 50, 44, 0.1)",
		zIndex: 1000,
	},
	title: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#38322C",
		fontFamily: "PlusJakartaSans_700Bold",
		letterSpacing: 4,
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
		borderWidth: 1.5,
		borderColor: "rgba(56, 50, 44, 0.15)",
	},
	avatarPlaceholder: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#38322C",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1.5,
		borderColor: "rgba(56, 50, 44, 0.15)",
	},
	avatarText: {
		color: "#D8CFC0",
		fontSize: 16,
		fontWeight: "600",
		fontFamily: "Inter_600SemiBold",
	},
	dropdown: {
		position: "absolute",
		top: 44,
		right: 0,
		backgroundColor: "#E2DACF",
		borderRadius: 12,
		width: 200,
		shadowColor: "rgba(56, 50, 44, 0.15)",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 1,
		shadowRadius: 16,
		elevation: 5,
		zIndex: 1000,
		borderWidth: 1,
		borderColor: "rgba(56, 50, 44, 0.1)",
	},
	dropdownHeader: {
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(56, 50, 44, 0.1)",
	},
	dropdownEmail: {
		color: "#526168",
		fontSize: 14,
		fontFamily: "Inter_400Regular",
	},
	dropdownItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		gap: 8,
	},
	dropdownText: {
		color: "#ba1a1a",
		fontSize: 16,
		fontFamily: "Inter_500Medium",
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
