import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	FlatList,
	ActivityIndicator,
	RefreshControl,
	StyleSheet,
	Alert,
} from "react-native";
import { ActivityCard, ActivityProps } from "../components/ActivityCard";
import { useAuth } from "../lib/auth/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.112.219.33:3000";

interface FeedScreenProps {
	onJumpToMap: (lat: number, lng: number) => void;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ onJumpToMap }) => {
	const { user } = useAuth();

	const [activities, setActivities] = useState<ActivityProps[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// --- NEW: RSVP State Management ---
	const [rsvpedActivityIds, setRsvpedActivityIds] = useState<string[]>([]);
	const [joiningActivityId, setJoiningActivityId] = useState<string | null>(
		null,
	);

	// Fetch the user's existing RSVPs so buttons stay accurate on reload
	const fetchUserRsvps = async () => {
		if (!user) return;
		try {
			// @ts-ignore
			const token = await user.getIdToken();
			const response = await fetch(`${API_URL}/users/me/rsvps`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.ok) {
				const data = await response.json();
				// Assuming your RSVP entity returns an array of objects containing the activityId
				const ids = data.map((rsvp: any) => rsvp.activityId);
				setRsvpedActivityIds(ids);
			}
		} catch (error) {
			console.error("Could not fetch user RSVPs:", error);
		}
	};

	const fetchFeed = async () => {
		try {
			const queryParams = "?minLat=00.0&maxLat=90.0&minLng=00.0&maxLng=180.0";

			const response = await fetch(`${API_URL}/activities${queryParams}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch: ${response.status}`);
			}

			const data = await response.json();
			setActivities(data);
		} catch (error) {
			console.error("Error fetching feed:", error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	// Load Feed and RSVPs concurrently
	useEffect(() => {
		fetchFeed();
		fetchUserRsvps();
	}, [user]); // Re-run if user auth state changes

	const onRefresh = () => {
		setRefreshing(true);
		fetchFeed();
		fetchUserRsvps();
	};

	const handleJoin = async (activityId: string) => {
		if (!user) {
			Alert.alert(
				"Not logged in",
				"You must be logged in to join an activity.",
			);
			return;
		}

		setJoiningActivityId(activityId); // Trigger the loading spinner on this specific card

		try {
			// @ts-ignore
			const token = await user.getIdToken();

			const response = await fetch(`${API_URL}/activities/${activityId}/rsvp`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				// Handle constraint errors if the database says they are already RSVP'd
				if (response.status === 409 || errorData.message?.includes("already")) {
					setRsvpedActivityIds((prev) => [...prev, activityId]);
					return;
				}
				throw new Error(errorData.message || "Failed to join activity");
			}

			// Optimistically update the UI to show "Joined ✓" immediately
			setRsvpedActivityIds((prev) => [...prev, activityId]);
		} catch (error: any) {
			console.error("Error joining activity:", error);
			Alert.alert(
				"Could not join",
				error.message || "An unexpected error occurred.",
			);
		} finally {
			setJoiningActivityId(null); // Turn off the loading spinner
		}
	};

	if (loading) {
		return (
			<View style={[styles.container, styles.centered]}>
				<ActivityIndicator size="large" color="#6366f1" />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.headerContainer}>
				<Text style={styles.headerTitle}>The Feed</Text>
				<Text style={styles.headerSubtitle}>See what the Trybe is up to.</Text>
			</View>

			<FlatList
				data={activities}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<ActivityCard
						activity={item}
						// --- NEW: Pass the computed state values down to the card ---
						isJoined={rsvpedActivityIds.includes(item.id)}
						isJoining={joiningActivityId === item.id}
						onPressJoin={() => handleJoin(item.id)}
						onPressLocation={() => {
							const [lng, lat] = item.location.coordinates;
							onJumpToMap(lat, lng);
						}}
					/>
				)}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.listContent}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#6366f1"
						colors={["#6366f1"]}
					/>
				}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyTitle}>No activities live right now.</Text>
						<Text style={styles.emptySubtitle}>Time to host one yourself?</Text>
					</View>
				}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#080e1f",
		paddingHorizontal: 16,
		paddingTop: 16,
	},
	centered: {
		justifyContent: "center",
		alignItems: "center",
	},
	headerContainer: {
		marginBottom: 16,
	},
	headerTitle: {
		color: "#ffffff",
		fontSize: 30,
		fontWeight: "bold",
		letterSpacing: -0.5,
	},
	headerSubtitle: {
		color: "#94a3b8",
		fontSize: 14,
		marginTop: 4,
	},
	listContent: {
		paddingBottom: 100,
	},
	emptyContainer: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 80,
	},
	emptyTitle: {
		color: "#64748b",
		fontSize: 18,
	},
	emptySubtitle: {
		color: "#475569",
		marginTop: 8,
		fontSize: 14,
	},
});
