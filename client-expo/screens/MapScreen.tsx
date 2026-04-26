import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import RadarMap from "../components/RadarMap";
import { useState } from "react";

interface MapScreenProps {
	initialRegion?: { latitude: number; longitude: number } | null;
	onMapMoved?: () => void;
}

export const MapScreen: React.FC<MapScreenProps> = () => {
	const [friendsOnly, setFriendsOnly] = useState(false);

	return (
		<View style={{ flex: 1, width: "100%", alignItems: "center" }}>
			<View style={styles.filterContainer}>
				<TouchableOpacity
					style={[styles.filterButton, !friendsOnly && styles.filterButtonActive]}
					onPress={() => setFriendsOnly(false)}
				>
					<Text style={[styles.filterButtonText, !friendsOnly && styles.filterButtonTextActive]}>All</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.filterButton, friendsOnly && styles.filterButtonActive]}
					onPress={() => setFriendsOnly(true)}
				>
					<Text style={[styles.filterButtonText, friendsOnly && styles.filterButtonTextActive]}>Friends</Text>
				</TouchableOpacity>
			</View>
			<RadarMap friendsOnly={friendsOnly} />
		</View>
	);
};

const styles = StyleSheet.create({
	filterContainer: {
		position: "absolute",
		top: 12,
		zIndex: 10,
		flexDirection: "row",
		backgroundColor: "#E2DACF",
		borderRadius: 8,
		padding: 2,
		shadowColor: "rgba(56, 50, 44, 0.15)",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 1,
		shadowRadius: 8,
		elevation: 4,
	},
	filterButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
	},
	filterButtonActive: {
		backgroundColor: "#221d18",
	},
	filterButtonText: {
		color: "rgba(56, 50, 44, 0.4)",
		fontSize: 13,
		fontWeight: "600",
		fontFamily: "Inter_600SemiBold",
	},
	filterButtonTextActive: {
		color: "#D8CFC0",
	},
});
