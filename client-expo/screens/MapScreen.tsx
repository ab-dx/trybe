import { View, Text, StyleSheet } from "react-native";
import RadarMap from "../components/RadarMap";

interface MapScreenProps {
	initialRegion?: { latitude: number; longitude: number } | null;
	onMapMoved?: () => void;
}

export const MapScreen: React.FC<MapScreenProps> = () => {
	return (
		<View
			style={{
				flex: 1,
				width: "100%",
				alignItems: "center",
			}}
		>
			<RadarMap />
		</View>
	);
};

const styles = StyleSheet.create({
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
