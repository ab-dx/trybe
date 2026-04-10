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

// 1. Import your custom auth hook (adjust the path to match your folder structure)
import { useAuth } from "../lib/auth/AuthContext";

export default function CreateActivity({ navigation }) {
	// 2. Destructure the user from your context
	const { user } = useAuth();

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
					"Trybe needs your location to host an activity.",
				);
				return;
			}
			let loc = await Location.getCurrentPositionAsync({});
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

		// 3. Safety check: ensure the user is actually authenticated
		if (!user)
			return Alert.alert(
				"Auth Error",
				"You must be logged in to host an activity.",
			);

		setIsSubmitting(true);

		try {
			// 4. Extract the fresh JWT from the Firebase User object
			// This guarantees the token is valid and unexpired for your NestJS AuthGuard
			const token = await user.getIdToken();

			const payload = {
				title,
				description,
				latitude: location.lat,
				longitude: location.lng,
				startTime: startTime.toISOString(),
				visibility,
			};

			// 5. Fire the request with the Bearer token
			// Make sure to replace 'YOUR_LOCAL_OR_PROD_URL' with your actual NestJS endpoint
			const response = await fetch(
				`http://${process.env.EXPO_PUBLIC_API_URL}:3000/activities`,
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
				// Log the actual backend error for easier debugging
				const errorData = await response.json().catch(() => ({}));
				console.error("Backend Error:", errorData);
				throw new Error("Failed to create activity on backend");
			}

			Alert.alert("Success!", "Your Trybe activity is live.");
			// navigation.goBack();
		} catch (error) {
			console.error("Creation flow error:", error);
			Alert.alert(
				"Error",
				"Could not create activity. Check your connection and try again.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<Text style={styles.headerTitle}>Host an Activity</Text>

			<View style={styles.inputGroup}>
				<Text style={styles.label}>Activity Title</Text>
				<TextInput
					style={styles.input}
					placeholder="e.g. Sunset 5K Run, Acoustic Jam..."
					placeholderTextColor="#64748B"
					value={title}
					onChangeText={setTitle}
				/>
			</View>

			<View style={styles.inputGroup}>
				<Text style={styles.label}>Description (Optional)</Text>
				<TextInput
					style={[styles.input, styles.textArea]}
					placeholder="What's the plan?"
					placeholderTextColor="#64748B"
					multiline
					numberOfLines={4}
					value={description}
					onChangeText={setDescription}
				/>
			</View>

			<View style={styles.inputGroup}>
				<Text style={styles.label}>Start Time</Text>
				<TouchableOpacity
					style={styles.input}
					onPress={() => setShowDatePicker(true)}
				>
					<Text style={{ color: "#E2E8F0" }}>
						{startTime.toLocaleString([], {
							dateStyle: "medium",
							timeStyle: "short",
						})}
					</Text>
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
				<Text style={styles.label}>Visibility</Text>
				<View style={styles.toggleContainer}>
					{["PUBLIC", "FRIENDS", "PRIVATE"].map((vis) => (
						<TouchableOpacity
							key={vis}
							style={[
								styles.toggleButton,
								visibility === vis && styles.toggleActive,
							]}
							onPress={() => setVisibility(vis)}
						>
							<Text
								style={[
									styles.toggleText,
									visibility === vis && styles.toggleTextActive,
								]}
							>
								{vis}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			<TouchableOpacity
				style={[
					styles.submitButton,
					isSubmitting && styles.submitButtonDisabled,
				]}
				onPress={handleCreate}
				disabled={isSubmitting || !location}
			>
				{isSubmitting ? (
					<ActivityIndicator color="#FFFFFF" />
				) : (
					<Text style={styles.submitButtonText}>
						{location ? "Create Activity" : "Getting Location..."}
					</Text>
				)}
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#0F172A" },
	content: { padding: 24, paddingBottom: 60 },
	headerTitle: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#FFFFFF",
		marginBottom: 24,
		marginTop: 40,
	},

	inputGroup: { marginBottom: 20 },
	label: {
		color: "#94A3B8",
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
		textTransform: "uppercase",
	},
	input: {
		backgroundColor: "#1E293B",
		color: "#E2E8F0",
		padding: 16,
		borderRadius: 12,
		fontSize: 16,
	},
	textArea: { height: 100, textAlignVertical: "top" },

	toggleContainer: { flexDirection: "row", gap: 8 },
	toggleButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		backgroundColor: "#1E293B",
		alignItems: "center",
	},
	toggleActive: { backgroundColor: "#3B82F6" },
	toggleText: { color: "#94A3B8", fontWeight: "bold", fontSize: 12 },
	toggleTextActive: { color: "#FFFFFF" },

	submitButton: {
		backgroundColor: "#10B981",
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: "center",
		marginTop: 20,
	},
	submitButtonDisabled: { opacity: 0.6 },
	submitButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 18 },
});
