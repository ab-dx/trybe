import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";

const INITIAL_ACTIVITIES = [
	{
		id: "1",
		title: "Sunset 5K Run",
		type: "Sports",
		lat: 37.78825,
		lng: -122.4324,
	},
	{
		id: "2",
		title: "Acoustic Jam Session",
		type: "Music",
		lat: 37.78925,
		lng: -122.4344,
	},
];

export default function RadarMap() {
	const [region, setRegion] = useState({
		latitude: 37.78825,
		longitude: -122.4324,
		latitudeDelta: 0.05, // Controls the initial zoom height
		longitudeDelta: 0.05, // Controls the initial zoom width
	});

	return (
		<View
			style={{ flex: 1, width: "100%", borderRadius: 20, overflow: "hidden" }}
		>
			<MapView
				style={styles.map}
				initialRegion={region} // Using initialRegion allows free panning without snapping back
				//mapType="none"
				showsUserLocation={true}
				scrollEnabled={true} // Enabled by default, but explicitly written here for clarity
				zoomEnabled={true} // Enabled by default
				pitchEnabled={true} // Allows 3D tilting with two fingers
				rotateEnabled={true} // Allows rotating the map with two fingers
			>
				{/* The library automatically injects the numbers into {z}, {x}, and {y} */}
				<UrlTile
					urlTemplate="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
					maximumZ={19}
					flipY={false}
				/>

				{INITIAL_ACTIVITIES.map((activity) => (
					<Marker
						key={activity.id}
						coordinate={{ latitude: activity.lat, longitude: activity.lng }}
						title={activity.title}
						description={activity.type}
						pinColor={activity.type === "Music" ? "blue" : "red"}
					/>
				))}
			</MapView>

			<View style={styles.attributionContainer} pointerEvents="none">
				<View style={styles.attributionBackground}>
					<Text style={styles.attributionText}>© OpenStreetMap, © CARTO</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#000" },
	map: { flex: 1 },
	attributionContainer: {
		position: "absolute",
		bottom: 16,
		left: 0,
		right: 0,
		alignItems: "center",
	},
	attributionBackground: {
		backgroundColor: "rgba(255, 255, 255, 0.8)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	attributionText: { fontSize: 12, color: "#333333", fontWeight: "500" },
});
