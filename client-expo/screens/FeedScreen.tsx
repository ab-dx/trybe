import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	Text,
	FlatList,
	ActivityIndicator,
	RefreshControl,
	StyleSheet,
	Alert,
	TouchableOpacity,
} from "react-native";
import { ActivityCard, ActivityProps } from "../components/ActivityCard";
import { useAuth } from "../lib/auth/AuthContext";
import {
	fetchProfile,
	fetchMyRsvps,
	joinActivity,
	fetchActivities,
	hypeActivity,
	unhypeActivity,
	fetchHypeStatuses,
} from "../lib/api";

const API_URL =
	process.env.EXPO_PUBLIC_API_URL || "http://10.112.219.33:3000";

interface FeedScreenProps {
	onJumpToMap: (lat: number, lng: number) => void;
}

interface ProfileSummary {
	id: string;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ onJumpToMap }) => {
	const { user, requireAuth } = useAuth();

	const [activities, setActivities] = useState<ActivityProps[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [friendsOnly, setFriendsOnly] = useState(false);

	const [rsvpedActivityIds, setRsvpedActivityIds] = useState<string[]>([]);
	const [hypedActivityIds, setHypedActivityIds] = useState<Record<string, boolean>>({});
	const [hypeLoadingId, setHypeLoadingId] = useState<string | null>(null);
	const [joiningActivityId, setJoiningActivityId] = useState<string | null>(
		null,
	);
	const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);

	const fetchUserRsvps = async () => {
		if (!user) return;
		try {
			const data = await fetchMyRsvps();
			const ids = data.map((rsvp: any) => rsvp.activityId);
			setRsvpedActivityIds(ids);
		} catch (error) {
			console.error("Could not fetch user RSVPs:", error);
		}
	};

	const fetchCurrentProfile = async () => {
		if (!user) {
			setCurrentProfileId(null);
			return;
		}

		try {
			const profile = (await fetchProfile()) as ProfileSummary;
			setCurrentProfileId(profile.id);
		} catch (error) {
			console.error("Could not fetch profile:", error);
		}
	};

	const fetchFeed = useCallback(async () => {
		try {
			const data = await fetchActivities(undefined, friendsOnly);
			setActivities(data);
			return data;
		} catch (error) {
			console.error("Error fetching feed:", error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [friendsOnly]);

	const fetchUserHypeStatuses = async (activityList: ActivityProps[]) => {
		if (!user || activityList.length === 0) return;
		const ids = activityList.map((a) => a.id);
		try {
			const statuses = await fetchHypeStatuses(ids);
			setHypedActivityIds(statuses);
		} catch (error) {
			console.error("Could not fetch hype statuses:", error);
		}
	};

	useEffect(() => {
		setLoading(true);
		fetchFeed().then((activities) => {
			if (user && activities) {
				fetchUserHypeStatuses(activities);
			}
		});
		if (user) {
			fetchUserRsvps();
			fetchCurrentProfile();
		} else {
			setRsvpedActivityIds([]);
			setCurrentProfileId(null);
		}
	}, [user, friendsOnly]);

	const onRefresh = () => {
		setRefreshing(true);
		fetchFeed().then((activities) => {
			fetchUserHypeStatuses(activities);
		});
		fetchUserRsvps();
		fetchCurrentProfile();
	};

	const handleJoin = async (activityId: string) => {
		if (!user) {
			requireAuth();
			return;
		}

		setJoiningActivityId(activityId); // Trigger the loading spinner on this specific card

		try {
			await joinActivity(activityId);

			// Optimistically update the UI to show "Joined ✓" immediately
			setRsvpedActivityIds((prev) =>
				prev.includes(activityId) ? prev : [...prev, activityId],
			);
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

	const handleHype = async (activityId: string) => {
		if (!user) {
			requireAuth();
			return;
		}

		setHypeLoadingId(activityId);

		try {
			const isCurrentlyHyped = hypedActivityIds[activityId];
			if (isCurrentlyHyped) {
				await unhypeActivity(activityId);
				setHypedActivityIds((prev) => ({ ...prev, [activityId]: false }));
			} else {
				await hypeActivity(activityId);
				setHypedActivityIds((prev) => ({ ...prev, [activityId]: true }));
			}
		} catch (error: any) {
			console.error("Error toggling hype:", error);
			Alert.alert(
				"Could not update hype",
				error.message || "An unexpected error occurred.",
			);
		} finally {
			setHypeLoadingId(null);
		}
	};

	if (loading) {
		return (
			<View style={[styles.container, styles.centered]}>
				<ActivityIndicator size="large" color="#38322C" />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<View style={styles.headerContainer}>
				<Text style={styles.headerTitle}>The Feed</Text>
				<Text style={styles.headerSubtitle}>
					{friendsOnly
						? "See what your friends are up to."
						: "See what the Trybe is up to."}
				</Text>
			</View>

			{/* Filter Pills */}
			<View style={styles.filterRow}>
				<TouchableOpacity
					style={[
						styles.filterPill,
						!friendsOnly && styles.filterPillActive,
					]}
					onPress={() => setFriendsOnly(false)}
					activeOpacity={0.8}
				>
					<Text
						style={[
							styles.filterPillText,
							!friendsOnly && styles.filterPillTextActive,
						]}
					>
						All
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.filterPill,
						friendsOnly && styles.filterPillActive,
					]}
					onPress={() => setFriendsOnly(true)}
					activeOpacity={0.8}
				>
					<Text
						style={[
							styles.filterPillText,
							friendsOnly && styles.filterPillTextActive,
						]}
					>
						Friends
					</Text>
				</TouchableOpacity>
			</View>

			<FlatList
				data={activities}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<ActivityCard
						activity={item}
						// --- NEW: Pass the computed state values down to the card ---
						isJoined={rsvpedActivityIds.includes(item.id)}
						isHostedByMe={item.host?.id === currentProfileId}
						isJoining={joiningActivityId === item.id}
						isHyped={hypedActivityIds[item.id] || false}
						isHypeLoading={hypeLoadingId === item.id}
						onPressJoin={() => handleJoin(item.id)}
						onPressHype={() => handleHype(item.id)}
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
						tintColor="#38322C"
						colors={["#38322C"]}
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
		backgroundColor: "#D8CFC0",
		paddingHorizontal: 24,
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
		color: "#221d18",
		fontSize: 32,
		fontWeight: "600",
		letterSpacing: -0.3,
		fontFamily: "PlusJakartaSans_600SemiBold",
	},
	headerSubtitle: {
		color: "#4c463f",
		fontSize: 16,
		marginTop: 4,
		fontFamily: "Inter_400Regular",
	},
	filterRow: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 20,
	},
	filterPill: {
		paddingHorizontal: 24,
		paddingVertical: 10,
		borderRadius: 9999,
		backgroundColor: "#e6e1e0",
	},
	filterPillActive: {
		backgroundColor: "#221d18",
	},
	filterPillText: {
		color: "#1c1b1b",
		fontSize: 14,
		fontWeight: "600",
		fontFamily: "Inter_600SemiBold",
		letterSpacing: 0.3,
	},
	filterPillTextActive: {
		color: "#ffffff",
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
		color: "#526168",
		fontSize: 18,
		fontFamily: "Inter_500Medium",
	},
	emptySubtitle: {
		color: "#7e766e",
		marginTop: 8,
		fontSize: 14,
		fontFamily: "Inter_400Regular",
	},
});
