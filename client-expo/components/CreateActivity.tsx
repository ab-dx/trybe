import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Alert,
	ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";

// 1. Import your custom auth hook
import { useAuth } from "../lib/auth/AuthContext";

export default function CreateActivity() {
	const { user, requireAuth } = useAuth();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startTime, setStartTime] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [visibility, setVisibility] = useState("PUBLIC");

	const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
		null,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		(async () => {
			let { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				Alert.alert(
					"Permission Denied",
					"Trybe needs your location to set a starting point for your activity.",
				);
				return;
			}
			let loc = await Location.getCurrentPositionAsync({});
			// Sets the initial pin drop to where the user currently is
			setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
		})();
	}, []);

	const onDateChange = (event: any, selectedDate?: Date) => {
		setShowDatePicker(false);
		if (selectedDate) setStartTime(selectedDate);
	};

	const handleCreate = async () => {
		if (!title.trim())
			return Alert.alert("Missing Info", "Give your Trybe activity a title!");
		if (!location)
			return Alert.alert("Locating...", "Still fetching your GPS coordinates.");

		if (!user)
			return Alert.alert(
				"Auth Error",
				"You must be logged in to host an activity.",
			);

		setIsSubmitting(true);

		try {
			const token = await user.getIdToken();

			const payload = {
				title,
				description,
				latitude: location.lat,
				longitude: location.lng, // Now reflects wherever the user dragged the pin
				startTime: startTime.toISOString(),
				visibility,
			};

			const response = await fetch(
				`${process.env.EXPO_PUBLIC_API_URL}/activities`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(payload),
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error("Backend Error:", errorData);
				throw new Error("Failed to create activity on backend");
			}

			Alert.alert("Success!", "Your Trybe activity is live.");
			// navigation.goBack();
		} catch (error) {
			console.error("Creation flow error:", error);
			Alert.alert("Error", "Could not create activity. Check your connection.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!user) {
        return (
            <View style={styles.guestContainer}>
                <View style={styles.guestIconWrapper}>
                    <MaterialIcons name="explore" size={36} color="#38322C" />
                </View>
                <Text style={styles.guestTitle}>Host an Activity</Text>
                <Text style={styles.guestSubtitle}>
                    Got an idea for a run, a study session, or a jam? Log in to put your activity on the map.
                </Text>
                <TouchableOpacity style={styles.guestButton} onPress={requireAuth}>
                    <Text style={styles.guestButtonText}>Log In to Host</Text>
                </TouchableOpacity>
            </View>
        );
    }

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<Text style={styles.headerTitle}>Host an Activity</Text>
			<Text style={styles.headerSubtitle}>
				Gather your tribe and create a new experience.
			</Text>

			<View style={styles.inputGroup}>
				<Text style={styles.label}>Activity Title</Text>
				<TextInput
					style={styles.input}
					placeholder="e.g. Sunset 5K Run, Acoustic Jam..."
					placeholderTextColor="rgba(76, 70, 63, 0.4)"
					value={title}
					onChangeText={setTitle}
				/>
			</View>

			<View style={styles.inputGroup}>
				<Text style={styles.label}>Start Time</Text>
				<TouchableOpacity
					style={styles.input}
					onPress={() => setShowDatePicker(true)}
				>
					<View style={styles.timeInputRow}>
						<Text style={styles.timeText}>
							{startTime.toLocaleString([], {
								dateStyle: "medium",
								timeStyle: "short",
							})}
						</Text>
						<MaterialIcons name="calendar-today" size={20} color="#526168" />
					</View>
				</TouchableOpacity>
				{showDatePicker && (
					<DateTimePicker
						value={startTime}
						mode="datetime"
						display="default"
						onChange={onDateChange}
					/>
				)}
			</View>

			<View style={styles.inputGroup}>
				<Text style={styles.label}>Description (Optional)</Text>
				<TextInput
					style={[styles.input, styles.textArea]}
					placeholder="What's the plan?"
					placeholderTextColor="rgba(76, 70, 63, 0.4)"
					multiline
					numberOfLines={4}
					value={description}
					onChangeText={setDescription}
				/>
			</View>

			{/* NEW: Interactive Location Picker */}
			<View style={styles.inputGroup}>
				<Text style={styles.label}>Exact Location</Text>
				{location ? (
					<View style={styles.mapContainer}>
						<MapView
							style={styles.map}
							initialRegion={{
								latitude: location.lat,
								longitude: location.lng,
								latitudeDelta: 0.02,
								longitudeDelta: 0.02,
							}}
							// We disable scrolling on the map itself so it doesn't fight
							// with the main ScrollView. The user must drag the pin instead.
							scrollEnabled={true}
							pitchEnabled={true}
							zoomEnabled={true}
						>
							<UrlTile
								urlTemplate="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
								maximumZ={19}
								flipY={false}
								zIndex={1}
							/>
							<Marker
								draggable // Makes the pin movable
								coordinate={{ latitude: location.lat, longitude: location.lng }}
								onDragEnd={(e) =>
									setLocation({
										lat: e.nativeEvent.coordinate.latitude,
										lng: e.nativeEvent.coordinate.longitude,
									})
								}
								pinColor="#4c2c00"
								zIndex={2}
							/>
						</MapView>
						<View style={styles.mapHintContainer}>
							<MaterialIcons name="touch-app" size={14} color="#4c463f" />
							<Text style={styles.mapHint}>
								Hold and drag the pin to adjust
							</Text>
						</View>
					</View>
				) : (
					<View style={[styles.mapContainer, styles.mapPlaceholder]}>
						<ActivityIndicator color="#38322C" />
						<Text style={styles.mapHintPlaceholder}>Locating you...</Text>
					</View>
				)}
			</View>

			{/* Action Buttons */}
			<View style={styles.actionContainer}>
				<TouchableOpacity
					style={[
						styles.submitButton,
						isSubmitting && styles.submitButtonDisabled,
					]}
					onPress={handleCreate}
					disabled={isSubmitting || !location}
				>
					{isSubmitting ? (
						<ActivityIndicator color="#D8CFC0" />
					) : (
						<Text style={styles.submitButtonText}>Create Activity</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity style={styles.draftButton}>
					<Text style={styles.draftButtonText}>Save as Draft</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#D8CFC0" },
	content: { padding: 24, paddingBottom: 60 },
	headerTitle: {
		fontSize: 32,
		fontWeight: "600",
		color: "#221d18",
		marginBottom: 8,
		marginTop: 16,
		fontFamily: "PlusJakartaSans_600SemiBold",
		letterSpacing: -0.3,
	},
	headerSubtitle: {
		fontSize: 16,
		color: "#4c463f",
		marginBottom: 32,
		fontFamily: "Inter_400Regular",
		lineHeight: 24,
	},

	inputGroup: { marginBottom: 24 },
	label: {
		color: "#221d18",
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
		fontFamily: "Inter_600SemiBold",
		letterSpacing: 0.3,
	},
	input: {
		backgroundColor: "#E2DACF",
		color: "#1c1b1b",
		padding: 16,
		borderRadius: 12,
		fontSize: 16,
		borderWidth: 1.5,
		borderColor: "rgba(82, 97, 104, 0.2)",
		fontFamily: "Inter_400Regular",
	},
	textArea: { height: 120, textAlignVertical: "top" },
	timeInputRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	timeText: {
		color: "#1c1b1b",
		fontSize: 16,
		fontFamily: "Inter_400Regular",
	},

	// Map Styles
	mapContainer: {
		borderRadius: 16,
		overflow: "hidden",
		backgroundColor: "#f2edeb",
		marginTop: 4,
		shadowColor: "rgba(56, 50, 44, 0.08)",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 1,
		shadowRadius: 16,
		elevation: 3,
	},
	map: { height: 200 },
	mapHintContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#E2DACF",
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderTopWidth: 1,
		borderTopColor: "rgba(34, 29, 24, 0.05)",
	},
	mapHint: {
		color: "#4c463f",
		fontSize: 12,
		fontWeight: "500",
		fontFamily: "Inter_500Medium",
		letterSpacing: 0.5,
	},
	mapPlaceholder: { height: 200, justifyContent: "center", alignItems: "center", gap: 12 },
	mapHintPlaceholder: { color: "#526168", fontSize: 14, fontFamily: "Inter_400Regular" },

	// Action Buttons
	actionContainer: { marginTop: 24, gap: 12 },
	submitButton: {
		backgroundColor: "#221d18",
		paddingVertical: 18,
		borderRadius: 12,
		alignItems: "center",
		shadowColor: "rgba(56, 50, 44, 0.15)",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 1,
		shadowRadius: 16,
		elevation: 5,
	},
	submitButtonDisabled: { opacity: 0.6 },
	submitButtonText: {
		color: "#D8CFC0",
		fontWeight: "600",
		fontSize: 14,
		fontFamily: "Inter_600SemiBold",
		letterSpacing: 0.3,
	},
	draftButton: {
		backgroundColor: "transparent",
		borderWidth: 1.5,
		borderColor: "#221d18",
		paddingVertical: 18,
		borderRadius: 12,
		alignItems: "center",
	},
	draftButtonText: {
		color: "#221d18",
		fontWeight: "600",
		fontSize: 14,
		fontFamily: "Inter_600SemiBold",
		letterSpacing: 0.3,
	},

	// Guest Styles
	guestContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#D8CFC0',
        padding: 32,
    },
    guestTitle: {
        color: '#221d18',
        fontSize: 24,
        fontWeight: '600',
        marginTop: 24,
        fontFamily: 'PlusJakartaSans_600SemiBold',
    },
    guestSubtitle: {
        color: '#4c463f',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 32,
        lineHeight: 24,
        fontFamily: 'Inter_400Regular',
    },
    guestButton: {
        backgroundColor: '#221d18',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    guestButtonText: {
        color: '#D8CFC0',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter_600SemiBold',
        letterSpacing: 0.3,
    },
	guestIconWrapper: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#E2DACF',
        borderWidth: 2,
        borderColor: 'rgba(56, 50, 44, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: 'rgba(56, 50, 44, 0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 5,
    },
});
