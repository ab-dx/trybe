import React, { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	Image,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
	Alert,
	TextInput,
	Modal,
	FlatList,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useAuth } from "../lib/auth/AuthContext";
import {
	endHostedActivity,
	cancelHostedActivity,
	makeActivityLive,
	fetchMyHosted,
	fetchMyRsvps,
	fetchProfile,
	fetchFriends,
	fetchIncomingRequests,
	fetchOutgoingRequests,
	searchUsers,
	sendFriendRequest,
	acceptFriendRequest,
	rejectFriendRequest,
	removeFriend,
	leaveRsvp,
	checkInToActivity,
} from "../lib/api";
import * as Location from "expo-location";

interface UserItem {
	id: string;
	displayName?: string;
	email?: string;
	avatarUrl?: string;
	trustScore: number;
	friendStatus?: "none" | "pending" | "outgoing" | "friends";
}

interface FriendRequestItem {
	id: string;
	requesterId: string;
	receiverId: string;
	status: string;
	requester?: UserItem;
	receiver?: UserItem;
	createdAt: string;
}

interface ActivityItem {
	id: string;
	title: string;
	description?: string;
	startTime: string;
	endTime?: string;
	status: string;
	hostId?: string;
	host?: { displayName?: string; email?: string };
}

interface RsvpItem {
	userId: string;
	activityId: string;
	checkedIn: boolean;
	activity: ActivityItem;
}

interface PastActivityItem {
	activity: ActivityItem;
	checkedIn: boolean;
	source: "HOSTED" | "RSVP";
}

interface ProfileData {
	id: string;
	displayName: string;
	email: string;
	avatarUrl?: string;
	trustScore: number;
	createdAt: string;
	activitiesHosted: number;
	activitiesJoined: number;
	checkIns: number;
}

const ENDED_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

const isActivityPast = (activity?: ActivityItem | null) => {
	if (!activity) return false;
	if (ENDED_STATUSES.has(activity.status)) return true;
	if (!activity.endTime) return false;

	const endTime = new Date(activity.endTime);
	return !Number.isNaN(endTime.getTime()) && endTime.getTime() <= Date.now();
};

const sortByStartTimeAsc = (left: ActivityItem, right: ActivityItem) =>
	new Date(left.startTime).getTime() - new Date(right.startTime).getTime();

const sortPastActivities = (left: PastActivityItem, right: PastActivityItem) =>
	new Date(right.activity.startTime).getTime() -
	new Date(left.activity.startTime).getTime();

const buildPastActivities = (
	hostedActivities: ActivityItem[],
	rsvps: RsvpItem[],
): PastActivityItem[] => {
	const items = new Map<string, PastActivityItem>();

	for (const activity of hostedActivities) {
		if (!isActivityPast(activity)) continue;

		items.set(activity.id, {
			activity,
			checkedIn: false,
			source: "HOSTED",
		});
	}

	for (const rsvp of rsvps) {
		if (!rsvp.activity || !isActivityPast(rsvp.activity)) continue;

		const existing = items.get(rsvp.activity.id);
		items.set(rsvp.activity.id, {
			activity: rsvp.activity,
			checkedIn: existing?.checkedIn || rsvp.checkedIn,
			source: existing?.source || "RSVP",
		});
	}

	return [...items.values()].sort(sortPastActivities);
};

export const ProfileScreen: React.FC = () => {
	const { user, logout } = useAuth();
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [activeHostedActivities, setActiveHostedActivities] = useState<
		ActivityItem[]
	>([]);
	const [upcomingRsvps, setUpcomingRsvps] = useState<RsvpItem[]>([]);
	const [pastActivities, setPastActivities] = useState<PastActivityItem[]>([]);

	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [endingActivityId, setEndingActivityId] = useState<string | null>(null);
	const [checkingInId, setCheckingInId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const [friends, setFriends] = useState<UserItem[]>([]);
	const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([]);
	const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([]);
	const [showSearchModal, setShowSearchModal] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<UserItem[]>([]);
	const [searching, setSearching] = useState(false);
	const [loadingFriends, setLoadingFriends] = useState(false);

	const loadProfileData = useCallback(async () => {
		try {
			setError(null);
			const [profileData, hostedResponse, rsvpResponse] = await Promise.all([
				fetchProfile(),
				fetchMyHosted(),
				fetchMyRsvps(),
			]);

			setProfile({
				...profileData,
				trustScore: profileData.trustScore ?? 0,
				activitiesHosted: profileData.activitiesHosted ?? 0,
				activitiesJoined: profileData.activitiesJoined ?? 0,
				checkIns: profileData.checkIns ?? 0,
			});

			const hostedActivities: ActivityItem[] = hostedResponse ?? [];
			const rsvps: RsvpItem[] = (rsvpResponse ?? []).filter(
				(rsvp: RsvpItem) => !!rsvp.activity,
			);

			setActiveHostedActivities(
				hostedActivities
					.filter((activity) => !isActivityPast(activity))
					.sort(sortByStartTimeAsc),
			);
			setUpcomingRsvps(
				rsvps
					.filter((rsvp) => !isActivityPast(rsvp.activity))
					.sort((left, right) =>
						sortByStartTimeAsc(left.activity, right.activity),
					),
			);
			setPastActivities(buildPastActivities(hostedActivities, rsvps));

			setLoadingFriends(true);
			const [friendsData, incomingData, outgoingData] = await Promise.all([
				fetchFriends(),
				fetchIncomingRequests(),
				fetchOutgoingRequests(),
			]);
			setFriends(friendsData);
			setIncomingRequests(incomingData);
			setOutgoingRequests(outgoingData);
			setLoadingFriends(false);
		} catch (err: any) {
			setError("Could not load profile data");
			console.error("Profile fetch error:", err);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		loadProfileData();
	}, [loadProfileData]);

	const onRefresh = () => {
		setRefreshing(true);
		loadProfileData();
	};

	const handleLogout = async () => {
		try {
			await logout();
		} catch {}
	};

	const runEndActivity = async (activityId: string) => {
		try {
			setEndingActivityId(activityId);
			await endHostedActivity(activityId);
			await loadProfileData();
		} catch (err: any) {
			console.error("End activity error:", err);
			Alert.alert(
				"Could not end activity",
				err?.message || "Please try again in a moment.",
			);
		} finally {
			setEndingActivityId(null);
		}
	};

	const runCancelActivity = async (activityId: string) => {
		try {
			setEndingActivityId(activityId);
			await cancelHostedActivity(activityId);
			await loadProfileData();
		} catch (err: any) {
			console.error("Cancel activity error:", err);
			Alert.alert(
				"Could not cancel activity",
				err?.message || "Please try again in a moment.",
			);
		} finally {
			setEndingActivityId(null);
		}
	};

	const runMakeLive = async (activityId: string) => {
		try {
			setEndingActivityId(activityId);
			await makeActivityLive(activityId);
			await loadProfileData();
			Alert.alert("Success!", "Activity is now live. Attendees can check in.");
		} catch (err: any) {
			console.error("Go live error:", err);
			Alert.alert(
				"Could not go live",
				err?.message || "Please try again in a moment.",
			);
		} finally {
			setEndingActivityId(null);
		}
	};

	const runLeaveRsvp = async (activityId: string) => {
		try {
			await leaveRsvp(activityId);
			await loadProfileData();
		} catch (err: any) {
			console.error("Leave RSVP error:", err);
			Alert.alert(
				"Could not leave activity",
				err?.message || "Please try again in a moment.",
			);
		}
	};

	const handleEndActivity = (activityId: string) => {
		Alert.alert(
			"End this activity?",
			"It will be removed from active lists and moved to Past Activities.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "End Activity",
					style: "destructive",
					onPress: () => {
						void runEndActivity(activityId);
					},
				},
			],
		);
	};

	const handleCancelActivity = (activityId: string) => {
		Alert.alert(
			"Cancel this activity?",
			"This will cancel the activity and reduce your trust score.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Cancel Activity",
					style: "destructive",
					onPress: () => {
						void runCancelActivity(activityId);
					},
				},
			],
		);
	};

	const handleMakeLive = (activityId: string) => {
		Alert.alert(
			"Go Live?",
			"This will make the activity live. Attendees will then be able to check in.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Go Live",
					onPress: () => {
						void runMakeLive(activityId);
					},
				},
			],
		);
	};

	const handleLeaveRsvp = (activityId: string) => {
		Alert.alert(
			"Leave this activity?",
			"Leaving within 2 hours of start time may reduce your trust.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Leave",
					style: "destructive",
					onPress: () => {
						void runLeaveRsvp(activityId);
					},
				},
			],
		);
	};

	const handleCheckIn = async (activityId: string) => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert(
					"Location Required",
					"Check-in requires location access to verify you're at the activity.",
				);
				return;
			}

			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
			});

			setCheckingInId(activityId);
			await checkInToActivity(activityId, location.coords.latitude, location.coords.longitude);
			await loadProfileData();
		} catch (err: any) {
			console.error("Check-in error:", err);
			Alert.alert(
				"Check-in Failed",
				err?.message || "Could not check in. Make sure you're near the activity.",
			);
		} finally {
			setCheckingInId(null);
		}
	};

	const handleSearchUsers = async (query: string) => {
		setSearchQuery(query);
		if (query.length < 2) {
			setSearchResults([]);
			return;
		}
		setSearching(true);
		try {
			const results = await searchUsers(query);
			setSearchResults(results);
		} catch (err: any) {
			console.error("Search error:", err);
		} finally {
			setSearching(false);
		}
	};

	const handleSendFriendRequest = async (userId: string) => {
		try {
			await sendFriendRequest(userId);
			Alert.alert("Friend request sent!");
			setShowSearchModal(false);
			setSearchQuery("");
			setSearchResults([]);
			loadProfileData();
		} catch (err: any) {
			Alert.alert("Error", err.message || "Could not send friend request");
		}
	};

	const handleAcceptRequest = async (requestId: string) => {
		try {
			await acceptFriendRequest(requestId);
			loadProfileData();
		} catch (err: any) {
			Alert.alert("Error", err.message || "Could not accept request");
		}
	};

	const handleRejectRequest = async (requestId: string) => {
		try {
			await rejectFriendRequest(requestId);
			loadProfileData();
		} catch (err: any) {
			Alert.alert("Error", err.message || "Could not reject request");
		}
	};

	const handleRemoveFriend = async (userId: string) => {
		Alert.alert(
			"Remove friend?",
			"This will remove them from your friends list.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Remove",
					style: "destructive",
					onPress: async () => {
						try {
							await removeFriend(userId);
							loadProfileData();
						} catch (err: any) {
							Alert.alert("Error", err.message || "Could not remove friend");
						}
					},
				},
			],
		);
	};

	const getFriendStatusBadge = (status?: string) => {
		switch (status) {
			case "pending":
				return { bg: "#422006", color: "#f59e0b", text: "Pending" };
			case "outgoing":
				return { bg: "#1e3a5f", color: "#3396ff", text: "Sent" };
			case "friends":
				return { bg: "#064e3b", color: "#10b981", text: "Friends" };
			default:
				return { bg: "#1e3a5f", color: "#3396ff", text: "Add" };
		}
	};

	const getInitial = (name?: string | null) => {
		if (!name) return "?";
		return name.charAt(0).toUpperCase();
	};

	const formatDate = (dateStr: string) => {
		const d = new Date(dateStr);
		return d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	const formatTime = (dateStr: string) => {
		const d = new Date(dateStr);
		return d.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const getPastBadge = (item: PastActivityItem) => {
		if (item.source === "HOSTED") {
			return {
				backgroundColor: "#422006",
				color: "#f59e0b",
				label: "HOSTED",
			};
		}

		if (item.checkedIn) {
			return {
				backgroundColor: "#064e3b",
				color: "#10b981",
				label: "CHECKED IN",
			};
		}

		return {
			backgroundColor: "#1e1b4b",
			color: "#8b5cf6",
			label: "ENDED",
		};
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#3396ff" />
				<Text style={styles.loadingText}>Loading profile…</Text>
			</View>
		);
	}

	if (error || !profile) {
		return (
			<View style={styles.loadingContainer}>
				<Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
				<Text style={styles.errorText}>
					{error || "Failed to load profile"}
				</Text>
				<TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
					<Text style={styles.retryText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	const stats = [
		{
			label: "Trust Score",
			value: profile.trustScore,
			icon: "shield-checkmark-outline" as const,
			color: "#10b981",
		},
		{
			label: "Hosted",
			value: profile.activitiesHosted,
			icon: "flag-outline" as const,
			color: "#f59e0b",
		},
		{
			label: "Joined",
			value: profile.activitiesJoined,
			icon: "people-outline" as const,
			color: "#3b82f6",
		},
		{
			label: "Check-ins",
			value: profile.checkIns,
			icon: "location-outline" as const,
			color: "#8b5cf6",
		},
	];

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					tintColor="#3396ff"
				/>
			}
		>
			<View style={styles.header}>
				<View style={styles.avatarGlow}>
					{user?.photoURL || profile.avatarUrl ? (
						<Image
							source={{ uri: user?.photoURL || profile.avatarUrl }}
							style={styles.avatar}
						/>
					) : (
						<View style={styles.avatarFallback}>
							<Text style={styles.avatarInitial}>
								{getInitial(profile.displayName || profile.email)}
							</Text>
						</View>
					)}
				</View>
				<Text style={styles.displayName}>
					{profile.displayName || "Trybe Member"}
				</Text>
				<Text style={styles.email}>{profile.email}</Text>
				<View style={styles.memberSince}>
					<Feather name="calendar" size={13} color="#64748b" />
					<Text style={styles.memberSinceText}>
						Joined {formatDate(profile.createdAt)}
					</Text>
				</View>
			</View>

			<View style={styles.statsGrid}>
				{stats.map((s) => (
					<View key={s.label} style={styles.statCard}>
						<Ionicons name={s.icon} size={22} color={s.color} />
						<Text style={[styles.statValue, { color: s.color }]}>
							{s.value}
						</Text>
						<Text style={styles.statLabel}>{s.label}</Text>
					</View>
				))}
			</View>

			<View style={styles.sectionHeader}>
				<Feather name="flag" size={18} color="#f59e0b" />
				<Text style={styles.sectionTitle}>Hosted by Me</Text>
				<View style={[styles.badge, { backgroundColor: "#422006" }]}>
					<Text style={[styles.badgeText, { color: "#f59e0b" }]}>
						{activeHostedActivities.length}
					</Text>
				</View>
			</View>

			{activeHostedActivities.length === 0 ? (
				<View style={styles.emptyState}>
					<Ionicons name="flag-outline" size={36} color="#334155" />
					<Text style={styles.emptyText}>No active hosted events</Text>
					<Text style={styles.emptySubtext}>
						Events you end will move into Past Activities.
					</Text>
				</View>
			) : (
				activeHostedActivities.map((activity) => (
					<View key={activity.id} style={styles.activityCard}>
						<View
							style={[
								styles.activityIndicator,
								{ backgroundColor: activity.status === 'LIVE' ? '#10b981' : '#f59e0b' },
							]}
						/>
						<View style={styles.activityInfo}>
							<Text style={styles.activityTitle}>{activity.title}</Text>
							<View style={styles.activityMeta}>
								<Feather name="clock" size={12} color="#64748b" />
								<Text style={styles.activityTime}>
									{formatTime(activity.startTime)}
								</Text>
							</View>
						</View>
						<View style={styles.activityActions}>
							<View
								style={[
									styles.statusBadge,
									styles.statusUpcoming,
									styles.compactStatusBadge,
								]}
							>
								<Text style={styles.statusText}>{activity.status}</Text>
							</View>
							{activity.status === 'UPCOMING' ? (
								<TouchableOpacity
									style={styles.goLiveButton}
									onPress={() => handleMakeLive(activity.id)}
									disabled={endingActivityId === activity.id}
								>
									{endingActivityId === activity.id ? (
										<ActivityIndicator size="small" color="#ffffff" />
									) : (
										<Text style={styles.goLiveButtonText}>Go Live</Text>
									)}
								</TouchableOpacity>
							) : activity.status === 'LIVE' ? (
								<>
									<TouchableOpacity
										style={styles.endButton}
										onPress={() => handleEndActivity(activity.id)}
										disabled={endingActivityId === activity.id}
									>
										{endingActivityId === activity.id ? (
											<ActivityIndicator size="small" color="#ffffff" />
										) : (
											<Text style={styles.endButtonText}>End</Text>
										)}
									</TouchableOpacity>
									<TouchableOpacity
										style={styles.cancelButton}
										onPress={() => handleCancelActivity(activity.id)}
										disabled={endingActivityId === activity.id}
									>
										<Text style={styles.cancelButtonText}>Cancel</Text>
									</TouchableOpacity>
								</>
							) : null}
						</View>
					</View>
				))
			)}

			<View style={styles.sectionHeader}>
				<Feather name="clock" size={18} color="#3396ff" />
				<Text style={styles.sectionTitle}>My RSVPs</Text>
				<View style={styles.badge}>
					<Text style={styles.badgeText}>{upcomingRsvps.length}</Text>
				</View>
			</View>

			{upcomingRsvps.length === 0 ? (
				<View style={styles.emptyState}>
					<Ionicons name="calendar-outline" size={36} color="#334155" />
					<Text style={styles.emptyText}>No upcoming RSVPs</Text>
					<Text style={styles.emptySubtext}>
						Join an event from the Map or Feed!
					</Text>
				</View>
			) : (
				upcomingRsvps.map((rsvp) => (
					<View key={`${rsvp.userId}-${rsvp.activityId}`} style={styles.activityCard}>
						<View style={styles.activityIndicator} />
						<View style={styles.activityInfo}>
							<Text style={styles.activityTitle}>{rsvp.activity.title}</Text>
							<View style={styles.activityMeta}>
								<Feather name="clock" size={12} color="#64748b" />
								<Text style={styles.activityTime}>
									{formatTime(rsvp.activity.startTime)}
								</Text>
							</View>
						</View>
						<View style={styles.activityActions}>
							{rsvp.checkedIn ? (
								<View style={styles.checkedInButton}>
									<Text style={styles.checkedInButtonText}>Checked In ✓</Text>
								</View>
							) : (
								<TouchableOpacity
									style={styles.checkInButton}
									onPress={() => handleCheckIn(rsvp.activityId)}
									disabled={checkingInId === rsvp.activityId}
								>
									{checkingInId === rsvp.activityId ? (
										<ActivityIndicator size="small" color="#ffffff" />
									) : (
										<Text style={styles.checkInButtonText}>Check In</Text>
									)}
								</TouchableOpacity>
							)}
							<TouchableOpacity
								style={styles.leaveButton}
								onPress={() => handleLeaveRsvp(rsvp.activityId)}
							>
								<Text style={styles.leaveButtonText}>Leave</Text>
							</TouchableOpacity>
						</View>
					</View>
				))
			)}

			<View style={[styles.sectionHeader, { marginTop: 28 }]}>
				<Feather name="archive" size={18} color="#8b5cf6" />
				<Text style={styles.sectionTitle}>Past Activities</Text>
				<View style={[styles.badge, { backgroundColor: "#1e1b4b" }]}>
					<Text style={[styles.badgeText, { color: "#8b5cf6" }]}>
						{pastActivities.length}
					</Text>
				</View>
			</View>

			{pastActivities.length === 0 ? (
				<View style={styles.emptyState}>
					<Ionicons name="time-outline" size={36} color="#334155" />
					<Text style={styles.emptyText}>No past activities yet</Text>
				</View>
			) : (
				pastActivities.map((item) => {
					const badge = getPastBadge(item);

					return (
						<View
							key={item.activity.id}
							style={[styles.activityCard, { opacity: 0.75 }]}
						>
							<View
								style={[
									styles.activityIndicator,
									{ backgroundColor: badge.color },
								]}
							/>
							<View style={styles.activityInfo}>
								<Text style={styles.activityTitle}>{item.activity.title}</Text>
								<View style={styles.activityMeta}>
									<Feather name="check-circle" size={12} color="#64748b" />
									<Text style={styles.activityTime}>
										{formatTime(item.activity.startTime)}
									</Text>
								</View>
								<Text style={styles.activitySubtext}>
									{item.source === "HOSTED"
										? "Hosted by you"
										: item.checkedIn
											? "You RSVP'd and checked in"
											: "You RSVP'd"}
								</Text>
							</View>
							<View
								style={[
									styles.statusBadge,
									{ backgroundColor: badge.backgroundColor },
								]}
							>
								<Text style={[styles.statusText, { color: badge.color }]}>
									{badge.label}
								</Text>
							</View>
						</View>
					);
				})
			)}

			<View style={[styles.sectionHeader, { marginTop: 28 }]}>
				<Feather name="users" size={18} color="#f59e0b" />
				<Text style={styles.sectionTitle}>Friends</Text>
				<TouchableOpacity
					style={styles.addFriendButton}
					onPress={() => setShowSearchModal(true)}
				>
					<Ionicons name="person-add-outline" size={14} color="#3396ff" />
					<Text style={styles.addFriendText}>Add</Text>
				</TouchableOpacity>
			</View>

			{loadingFriends ? (
				<View style={styles.emptyState}>
					<ActivityIndicator size="small" color="#3396ff" />
				</View>
			) : (
				<>
					{incomingRequests.length > 0 && (
						<View style={styles.friendsSection}>
							<Text style={styles.friendsSectionTitle}>Requests</Text>
							{incomingRequests.map((req) => (
								<View key={req.id} style={styles.friendCard}>
									{req.requester?.avatarUrl ? (
										<Image
											source={{ uri: req.requester.avatarUrl }}
											style={styles.friendAvatar}
										/>
									) : (
										<View style={styles.friendAvatarPlaceholder}>
											<Text style={styles.friendAvatarText}>
												{req.requester?.displayName?.charAt(0).toUpperCase() || "?"}
											</Text>
										</View>
									)}
									<View style={styles.friendInfo}>
										<Text style={styles.friendName}>
											{req.requester?.displayName || req.requester?.email || "Unknown"}
										</Text>
										<Text style={styles.friendTrust}>
											Trust: {req.requester?.trustScore || 0}
										</Text>
									</View>
									<View style={styles.friendActions}>
										<TouchableOpacity
											style={styles.acceptButton}
											onPress={() => handleAcceptRequest(req.id)}
										>
											<Ionicons name="checkmark" size={16} color="#fff" />
										</TouchableOpacity>
										<TouchableOpacity
											style={styles.rejectButton}
											onPress={() => handleRejectRequest(req.id)}
										>
											<Ionicons name="close" size={16} color="#fff" />
										</TouchableOpacity>
									</View>
								</View>
							))}
						</View>
					)}

					{outgoingRequests.length > 0 && (
						<View style={styles.friendsSection}>
							<Text style={styles.friendsSectionTitle}>Sent Requests</Text>
							{outgoingRequests.map((req) => (
								<View key={req.id} style={styles.friendCard}>
									{req.receiver?.avatarUrl ? (
										<Image
											source={{ uri: req.receiver.avatarUrl }}
											style={styles.friendAvatar}
										/>
									) : (
										<View style={styles.friendAvatarPlaceholder}>
											<Text style={styles.friendAvatarText}>
												{req.receiver?.displayName?.charAt(0).toUpperCase() || "?"}
											</Text>
										</View>
									)}
									<View style={styles.friendInfo}>
										<Text style={styles.friendName}>
											{req.receiver?.displayName || req.receiver?.email || "Unknown"}
										</Text>
										<Text style={styles.friendTrust}>Pending...</Text>
									</View>
								</View>
							))}
						</View>
					)}

					{friends.length === 0 && incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
						<View style={styles.emptyState}>
							<Ionicons name="people-outline" size={36} color="#334155" />
							<Text style={styles.emptyText}>No friends yet</Text>
							<Text style={styles.emptySubtext}>
								Add friends to see their activities!
							</Text>
						</View>
					) : (
						<View style={styles.friendsSection}>
							{friends.length > 0 && <Text style={styles.friendsSectionTitle}>My Friends</Text>}
							{friends.map((friend) => (
								<View key={friend.id} style={styles.friendCard}>
									{friend.avatarUrl ? (
										<Image source={{ uri: friend.avatarUrl }} style={styles.friendAvatar} />
									) : (
										<View style={styles.friendAvatarPlaceholder}>
											<Text style={styles.friendAvatarText}>
												{friend.displayName?.charAt(0).toUpperCase() || "?"}
											</Text>
										</View>
									)}
									<View style={styles.friendInfo}>
										<Text style={styles.friendName}>
											{friend.displayName || friend.email?.split('@')[0] || "Unknown"}
										</Text>
										<Text style={styles.friendTrust}>Trust: {friend.trustScore}</Text>
									</View>
									<TouchableOpacity
										style={styles.removeButton}
										onPress={() => handleRemoveFriend(friend.id)}
									>
										<Text style={styles.removeButtonText}>Remove</Text>
									</TouchableOpacity>
								</View>
							))}
						</View>
					)}
				</>
			)}

			<Modal
				visible={showSearchModal}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setShowSearchModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Find Friends</Text>
							<TouchableOpacity onPress={() => setShowSearchModal(false)}>
								<Ionicons name="close" size={24} color="#fff" />
							</TouchableOpacity>
						</View>
						<TextInput
							style={styles.searchInput}
							placeholder="Search by email or name..."
							placeholderTextColor="#64748b"
							value={searchQuery}
							onChangeText={handleSearchUsers}
							autoCapitalize="none"
							autoCorrect={false}
						/>
						{searching && (
							<View style={styles.searchLoading}>
								<ActivityIndicator size="small" color="#3396ff" />
							</View>
						)}
						<FlatList
							data={searchResults}
							keyExtractor={(item) => item.id}
							renderItem={({ item }) => (
								<View style={styles.searchResultItem}>
									{item.avatarUrl ? (
										<Image source={{ uri: item.avatarUrl }} style={styles.friendAvatar} />
									) : (
										<View style={styles.friendAvatarPlaceholder}>
											<Text style={styles.friendAvatarText}>
												{item.displayName?.charAt(0).toUpperCase() || "?"}
											</Text>
										</View>
									)}
									<View style={styles.friendInfo}>
										<Text style={styles.friendName}>
											{item.displayName || item.email || "Unknown"}
										</Text>
										<Text style={styles.friendTrust}>Trust: {item.trustScore}</Text>
									</View>
									{(() => {
										const badge = getFriendStatusBadge(item.friendStatus);
										if (item.friendStatus === "friends") {
											return (
												<View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
													<Text style={[styles.statusText, { color: badge.color }]}>
														{badge.text}
													</Text>
												</View>
											);
										}
										if (item.friendStatus === "pending" || item.friendStatus === "outgoing") {
											return (
												<View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
													<Text style={[styles.statusText, { color: badge.color }]}>
														{badge.text}
													</Text>
												</View>
											);
										}
										return (
											<TouchableOpacity
												style={styles.addButton}
												onPress={() => handleSendFriendRequest(item.id)}
											>
												<Text style={styles.addButtonText}>Add</Text>
											</TouchableOpacity>
										);
									})()}
								</View>
							)}
							ListEmptyComponent={
								searchQuery.length >= 2 && !searching ? (
									<Text style={styles.noResultsText}>No users found</Text>
								) : null
							}
						/>
					</View>
				</View>
			</Modal>

			<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
				<Ionicons name="log-out-outline" size={20} color="#ef4444" />
				<Text style={styles.logoutText}>Sign Out</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#080e1f" },
	content: { paddingBottom: 40 },
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#080e1f",
	},
	loadingText: { color: "#64748b", marginTop: 12, fontSize: 14 },
	errorText: { color: "#ef4444", marginTop: 12, fontSize: 16 },
	retryButton: {
		marginTop: 16,
		paddingHorizontal: 24,
		paddingVertical: 10,
		backgroundColor: "#1e293b",
		borderRadius: 8,
	},
	retryText: { color: "#3396ff", fontWeight: "600" },
	header: {
		alignItems: "center",
		paddingTop: 32,
		paddingBottom: 24,
		borderBottomWidth: 1,
		borderBottomColor: "#1e293b",
	},
	avatarGlow: {
		width: 92,
		height: 92,
		borderRadius: 46,
		backgroundColor: "#1e293b",
		borderWidth: 3,
		borderColor: "#3396ff",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#3396ff",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.4,
		shadowRadius: 16,
		elevation: 8,
	},
	avatar: { width: 84, height: 84, borderRadius: 42 },
	avatarFallback: {
		width: 84,
		height: 84,
		borderRadius: 42,
		backgroundColor: "#334155",
		justifyContent: "center",
		alignItems: "center",
	},
	avatarInitial: { color: "#fff", fontSize: 32, fontWeight: "700" },
	displayName: {
		color: "#fff",
		fontSize: 22,
		fontWeight: "700",
		marginTop: 14,
	},
	email: { color: "#64748b", fontSize: 14, marginTop: 4 },
	memberSince: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 8,
	},
	memberSinceText: { color: "#64748b", fontSize: 12 },
	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingHorizontal: 12,
		paddingTop: 20,
		gap: 10,
	},
	statCard: {
		flex: 1,
		minWidth: "44%",
		backgroundColor: "#0f172a",
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#1e293b",
		paddingVertical: 16,
		paddingHorizontal: 12,
		alignItems: "center",
		gap: 4,
	},
	statValue: { fontSize: 24, fontWeight: "800" },
	statLabel: {
		color: "#64748b",
		fontSize: 11,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		marginTop: 24,
		marginBottom: 12,
	},
	sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "700", flex: 1 },
	badge: {
		backgroundColor: "#0c2d5a",
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 3,
	},
	badgeText: { color: "#3396ff", fontSize: 12, fontWeight: "700" },
	comingSoon: {
		backgroundColor: "#422006",
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 3,
	},
	comingSoonText: { color: "#f59e0b", fontSize: 11, fontWeight: "700" },
	activityCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#0f172a",
		marginHorizontal: 16,
		marginBottom: 10,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#1e293b",
		overflow: "hidden",
	},
	activityIndicator: {
		width: 4,
		alignSelf: "stretch",
		backgroundColor: "#3396ff",
	},
	activityInfo: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
	activityActions: {
		paddingRight: 14,
		paddingVertical: 12,
		alignItems: "flex-end",
		gap: 8,
	},
	activityTitle: { color: "#e2e8f0", fontSize: 15, fontWeight: "600" },
	activityMeta: {
		flexDirection: "row",
		alignItems: "center",
		gap: 5,
		marginTop: 5,
	},
	activityTime: { color: "#64748b", fontSize: 12 },
	activitySubtext: { color: "#475569", fontSize: 12, marginTop: 6 },
	statusBadge: {
		marginRight: 14,
		borderRadius: 6,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	compactStatusBadge: {
		marginRight: 0,
	},
	statusUpcoming: { backgroundColor: "#0c2d5a" },
	statusPast: { backgroundColor: "#1e1b4b" },
	statusText: { color: "#3396ff", fontSize: 10, fontWeight: "700" },
	endButton: {
		minWidth: 72,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		backgroundColor: "#7f1d1d",
	},
	endButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
	cancelButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		backgroundColor: "#7f1d1d",
	},
	cancelButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
	goLiveButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		backgroundColor: "#10b981",
	},
	goLiveButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
	leaveButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		backgroundColor: "#7f1d1d",
	},
	leaveButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
	checkInButton: {
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 8,
		backgroundColor: "#10b981",
	},
	checkInButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
	checkedInButton: {
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 8,
		backgroundColor: "#475569",
	},
	checkedInButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
	emptyState: {
		alignItems: "center",
		paddingVertical: 28,
		marginHorizontal: 16,
		backgroundColor: "#0f172a",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#1e293b",
	},
	emptyText: {
		color: "#475569",
		fontSize: 14,
		fontWeight: "600",
		marginTop: 8,
	},
	emptySubtext: { color: "#334155", fontSize: 12, marginTop: 4 },
	logoutButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		marginHorizontal: 16,
		marginTop: 32,
		paddingVertical: 14,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#7f1d1d",
		backgroundColor: "#1a0a0a",
	},
	logoutText: { color: "#ef4444", fontSize: 16, fontWeight: "600" },
	addFriendButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: "#0c2d5a",
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 12,
	},
	addFriendText: { color: "#3396ff", fontSize: 12, fontWeight: "600" },
	friendsSection: {
		marginBottom: 12,
	},
	friendsSectionTitle: {
		color: "#64748b",
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginLeft: 16,
		marginBottom: 8,
	},
	friendCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#0f172a",
		marginHorizontal: 16,
		marginBottom: 8,
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#1e293b",
	},
	friendAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	friendAvatarPlaceholder: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#334155",
		justifyContent: "center",
		alignItems: "center",
	},
	friendAvatarText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	friendInfo: {
		flex: 1,
		marginLeft: 12,
	},
	friendName: {
		color: "#e2e8f0",
		fontSize: 14,
		fontWeight: "600",
	},
	friendTrust: {
		color: "#64748b",
		fontSize: 12,
		marginTop: 2,
	},
	friendActions: {
		flexDirection: "row",
		gap: 8,
	},
	acceptButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#10b981",
		justifyContent: "center",
		alignItems: "center",
	},
	rejectButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#ef4444",
		justifyContent: "center",
		alignItems: "center",
	},
	removeButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		backgroundColor: "#7f1d1d",
		borderRadius: 6,
	},
	removeButtonText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "600",
	},
	addButton: {
		paddingHorizontal: 14,
		paddingVertical: 6,
		backgroundColor: "#3396ff",
		borderRadius: 6,
	},
	addButtonText: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "600",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.7)",
		justifyContent: "flex-end",
	},
	modalContent: {
		backgroundColor: "#0f172a",
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingBottom: 40,
		maxHeight: "80%",
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#1e293b",
	},
	modalTitle: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "700",
	},
	searchInput: {
		margin: 16,
		padding: 12,
		backgroundColor: "#1e293b",
		borderRadius: 8,
		color: "#fff",
		fontSize: 14,
	},
	searchLoading: {
		padding: 16,
		alignItems: "center",
	},
	searchResultItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#1e293b",
	},
	noResultsText: {
		color: "#64748b",
		textAlign: "center",
		padding: 20,
	},
});
