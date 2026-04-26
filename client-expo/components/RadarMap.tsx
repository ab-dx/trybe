import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, UrlTile, Region, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { auth } from "../lib/firebase";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.112.219.33:3000";
const ZOOM_THRESHOLD = 0.15;

const FALLBACK_REGION: Region = {
	latitude: 25.5941,
	longitude: 85.1376,
	latitudeDelta: 0.05,
	longitudeDelta: 0.05,
};

interface Activity {
	id: string;
	title: string;
	description?: string;
	latitude: number;
	longitude: number;
	startTime: string;
	type?: string;
}

interface RadarMapProps {
	friendsOnly?: boolean;
}

export default function RadarMap({ friendsOnly = false }: RadarMapProps) {
	const mapRef = useRef<MapView>(null);
	const [activities, setActivities] = useState<any[]>([]);
	const [isFetching, setIsFetching] = useState(false);
	const [isZoomedOut, setIsZoomedOut] = useState(false);

	useEffect(() => {
		(async () => {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				console.warn("Location permission denied. Using fallback region.");
				fetchActivitiesInBounds(FALLBACK_REGION);
				return;
			}

			try {
				const location = await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.Balanced,
				});

				const userRegion = {
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
					latitudeDelta: 0.05,
					longitudeDelta: 0.05,
				};
				mapRef.current?.animateToRegion(userRegion, 1000);
				fetchActivitiesInBounds(userRegion);
			} catch (error) {
				console.error("Error fetching location:", error);
				fetchActivitiesInBounds(FALLBACK_REGION);
			}
		})();
	}, []);

	const fetchActivitiesInBounds = useCallback(async (region: Region) => {
		if (region.latitudeDelta > ZOOM_THRESHOLD) {
			setIsZoomedOut(true);
			setActivities([]);
			return;
		}

		setIsZoomedOut(false);
		setIsFetching(true);

		const minLat = region.latitude - region.latitudeDelta / 2;
		const maxLat = region.latitude + region.latitudeDelta / 2;
		const minLng = region.longitude - region.longitudeDelta / 2;
		const maxLng = region.longitude + region.longitudeDelta / 2;

		try {
			const user = auth.currentUser;
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
			};

			if (user) {
				const token = await user.getIdToken();
				headers["Authorization"] = `Bearer ${token}`;
			}

			let url = `${API_URL}/activities?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`;
			if (friendsOnly) {
				url += "&friendsOnly=true";
			}

			const response = await fetch(url, { headers });

			if (!response.ok) throw new Error("Failed to fetch activities");

			const data = await response.json();
			setActivities(data);
		} catch (error) {
			console.error("Radar Error:", error);
		} finally {
			setIsFetching(false);
		}
	}, [friendsOnly]);

	return (
		<View style={styles.container}>
			<MapView
				ref={mapRef}
				style={styles.map}
				initialRegion={FALLBACK_REGION}
				showsUserLocation={true}
				showsMyLocationButton={true}
				scrollEnabled={true}
				zoomEnabled={true}
				pitchEnabled={true}
				rotateEnabled={true}
				onRegionChangeComplete={fetchActivitiesInBounds}
			>
				<UrlTile
					urlTemplate="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
					maximumZ={19}
					flipY={false}
				/>

				{}
				{activities.map((activity) => {
					const lat = parseFloat(activity.location.coordinates[1] as any);
					const lng = parseFloat(activity.location.coordinates[0] as any);
					if (isNaN(lat) || isNaN(lng)) {
						console.warn(
							`Activity ${activity.id} has invalid coordinates. Skipping.`,
						);
						return null;
					}
					// console.log(lat, " ");
					// console.log(lng, "bitchass");
					return (
						<Marker
							key={activity.id}
							coordinate={{ latitude: lat, longitude: lng }}
							pinColor="red"
							title={activity.title}
							description={activity.description}
						/>
					);
				})}
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
	container: {
		flex: 1,
		width: "100%",
		borderRadius: 20,
		overflow: "hidden",
		position: "relative",
	},
	map: { flex: 1 },
	calloutContainer: {
		width: 200,
		padding: 8,
		borderRadius: 12,
	},
	calloutTitle: {
		fontWeight: "bold",
		fontSize: 16,
		marginBottom: 4,
		color: "#1a1a1a",
	},
	calloutDescription: {
		fontSize: 14,
		color: "#666",
		marginBottom: 6,
	},
	calloutTime: {
		fontSize: 12,
		fontWeight: "600",
		color: "#007AFF",
	},
	overlayMessage: {
		position: "absolute",
		top: 20,
		alignSelf: "center",
		backgroundColor: "rgba(0, 0, 0, 0.75)",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
	},
	overlayText: { color: "white", fontWeight: "600", fontSize: 14 },
	loadingContainer: {
		position: "absolute",
		top: 20,
		right: 20,
		backgroundColor: "rgba(255, 255, 255, 0.9)",
		padding: 8,
		borderRadius: 20,
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
	},
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
