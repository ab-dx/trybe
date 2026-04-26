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
		<View
			style={{
				flex: 1,
				width: "100%",
				alignItems: "center",
			}}
		>
			<View style={styles.filterContainer}>
				<TouchableOpacity
					style={[
						styles.filterButton,
						!friendsOnly && styles.filterButtonActive,
					]}
					onPress={() => setFriendsOnly(false)}
				>
					<Text
						style={[
							styles.filterButtonText,
							!friendsOnly && styles.filterButtonTextActive,
						]}
					>
						All
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.filterButton,
						friendsOnly && styles.filterButtonActive,
					]}
					onPress={() => setFriendsOnly(true)}
				>
					<Text
						style={[
							styles.filterButtonText,
							friendsOnly && styles.filterButtonTextActive,
						]}
					>
						Friends
					</Text>
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
		backgroundColor: "#1e293b",
		borderRadius: 8,
		padding: 2,
	},
	filterButton: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 6,
	},
	filterButtonActive: {
		backgroundColor: "#3396ff",
	},
	filterButtonText: {
		color: "#64748b",
		fontSize: 13,
		fontWeight: "600",
	},
	filterButtonTextActive: {
		color: "#ffffff",
	},
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#080e1f",
	},
	title: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#fff",
	},
	subtitle: {
		fontSize: 16,
		color: "#9ca3af",
		marginTop: 8,
	},
});
