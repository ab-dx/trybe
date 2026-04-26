import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

function getTrustBadge(score: number): { emoji: string; label: string } {
	if (score >= 76) return { emoji: "⭐", label: "Veteran" };
	if (score >= 51) return { emoji: "🟢", label: "Trusted" };
	if (score >= 26) return { emoji: "🟡", label: "Regular" };
	return { emoji: "🔴", label: "New" };
}

export interface ActivityProps {
	id: string;
	title: string;
	description?: string;
	startTime: string;
	status: string;
	rsvpCount?: number;
	location: {
		type: string;
		coordinates: [number, number]; // [longitude, latitude]
	};
	host: {
		id: string;
		email?: string;
		displayName?: string;
		trustScore?: number;
		trustBadge?: {
			emoji: string;
			label: string;
		};
	};
}

export interface ActivityCardProps {
	activity: ActivityProps;
	onPressLocation: () => void;
	onPressJoin: () => void;
	onPressHype: () => void;
	isJoined?: boolean;
	isJoining?: boolean;
	isHostedByMe?: boolean;
	isHyped?: boolean;
	isHypeLoading?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
	activity,
	onPressLocation,
	onPressJoin,
	onPressHype,
	isJoined = false,
	isJoining = false,
	isHostedByMe = false,
	isHyped = false,
	isHypeLoading = false,
}) => {
	const [address, setAddress] = useState<string>("Locating...");

	useEffect(() => {
		let isMounted = true;

		const fetchAddress = async () => {
			try {
				const [longitude, latitude] = activity.location.coordinates;

				const geocodeResult = await Location.reverseGeocodeAsync({
					latitude,
					longitude,
				});

				if (isMounted && geocodeResult.length > 0) {
					const place = geocodeResult[0];
					const specificName = place.name || place.street;
					const region = place.city || place.subregion || place.region;

					if (specificName && region && specificName !== region) {
						setAddress(`${specificName}, ${region}`);
					} else {
						setAddress(specificName || region || "Unknown Location");
					}
				} else if (isMounted) {
					setAddress("Location unavailable");
				}
			} catch (error) {
				console.warn("Geocoding failed for card:", error);
				if (isMounted) setAddress("Coordinates only");
			}
		};

		fetchAddress();

		return () => {
			isMounted = false;
		};
	}, [activity.location]);

	const dateObj = new Date(activity.startTime);
	const formattedTime = dateObj.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
	const formattedDate = dateObj.toLocaleDateString([], {
		month: "short",
		day: "numeric",
	});

	const hostDisplayName =
		activity.host?.displayName ||
		activity.host?.email?.split("@")[0] ||
		"Unknown Host";
	const hostScore = activity.host?.trustScore ?? 100;
	const trustBadge = getTrustBadge(hostScore);
	const joinButtonDisabled = isHostedByMe || isJoined || isJoining;
	const joinButtonLabel = isHostedByMe
		? "Hosting"
		: isJoined
			? "Joined ✓"
			: "Join";

	return (
		<View style={styles.card}>
			{/* Header: Host & Trust Score */}
			<View style={styles.header}>
				<View style={styles.hostInfo}>
					<View style={styles.avatar}>
						<Text style={styles.avatarText}>
							{hostDisplayName.charAt(0).toUpperCase()}
						</Text>
					</View>
					<View>
						<View style={styles.hostNameRow}>
							<Text style={styles.hostName}>{hostDisplayName}</Text>
							<View style={styles.trustBadge}>
								<Text style={styles.trustBadgeText}>
									{trustBadge.label.toUpperCase()} {hostScore}
								</Text>
							</View>
						</View>
						<Text style={styles.dateText}>{formattedDate} • {formattedTime}</Text>
					</View>
				</View>
			</View>

			{/* Body: Title & Details */}
			<Text style={styles.title}>{activity.title}</Text>

			{activity.description ? (
				<Text style={styles.description} numberOfLines={2}>
					{activity.description}
				</Text>
			) : null}

			{/* Location Chip */}
			<TouchableOpacity
				style={styles.locationContainer}
				onPress={onPressLocation}
				activeOpacity={0.6}
			>
				<MaterialIcons name="location-on" size={16} color="#4c463f" />
				<Text style={styles.locationText} numberOfLines={1}>
					{address}
				</Text>
			</TouchableOpacity>

			{/* RSVP Count */}
			{(activity.rsvpCount || 0) > 0 && (
				<View style={styles.rsvpChip}>
					<MaterialIcons name="group" size={16} color="#4c463f" />
					<Text style={styles.rsvpText}>
						{activity.rsvpCount} {activity.rsvpCount === 1 ? "RSVP" : "RSVPs"}
					</Text>
				</View>
			)}

			{/* Footer Actions */}
			<View style={styles.footer}>
				{/* Join Button */}
				<TouchableOpacity
					style={[
						styles.joinButton,
						(isHostedByMe || isJoined) && styles.joinedButton,
					]}
					activeOpacity={0.8}
					onPress={onPressJoin}
					disabled={joinButtonDisabled}
				>
					{isJoining ? (
						<ActivityIndicator
							size="small"
							color="#D8CFC0"
							style={{ paddingHorizontal: 10 }}
						/>
					) : (
						<Text
							style={[
								styles.joinButtonText,
								(isHostedByMe || isJoined) && styles.joinedButtonText,
							]}
						>
							{joinButtonLabel}
						</Text>
					)}
				</TouchableOpacity>

				{/* Hype Button */}
				<TouchableOpacity
					style={[styles.hypeButton, isHyped && styles.hypedButton]}
					activeOpacity={0.7}
					onPress={onPressHype}
					disabled={isHypeLoading}
				>
					{isHypeLoading ? (
						<ActivityIndicator size="small" color="#38322C" />
					) : (
						<View style={styles.hypeContent}>
							<MaterialIcons
								name="bolt"
								size={18}
								color={isHyped ? "#D8CFC0" : "#38322C"}
							/>
							{isHyped && <Text style={styles.hypeButtonTextActive}>Hyped</Text>}
						</View>
					)}
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#E2DACF",
		borderRadius: 16,
		padding: 24,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "rgba(82, 97, 104, 0.1)",
		shadowColor: "rgba(56, 50, 44, 0.08)",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 1,
		shadowRadius: 16,
		elevation: 3,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 16,
	},
	hostInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#f2edeb",
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: {
		color: "#38322C",
		fontWeight: "bold",
		fontSize: 16,
		fontFamily: "Inter_700Bold",
	},
	hostNameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	hostName: {
		color: "#221d18",
		fontWeight: "600",
		fontSize: 14,
		fontFamily: "Inter_600SemiBold",
	},
	trustBadge: {
		backgroundColor: "rgba(76, 44, 0, 0.08)",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 9999,
	},
	trustBadgeText: {
		color: "#c79152",
		fontSize: 10,
		fontWeight: "700",
		letterSpacing: -0.3,
		fontFamily: "Inter_700Bold",
	},
	dateText: {
		color: "#4c463f",
		fontSize: 12,
		fontFamily: "Inter_500Medium",
		letterSpacing: 0.5,
		marginTop: 2,
	},
	title: {
		color: "#221d18",
		fontSize: 24,
		fontWeight: "600",
		marginBottom: 4,
		fontFamily: "PlusJakartaSans_600SemiBold",
	},
	description: {
		color: "#1c1b1b",
		fontSize: 16,
		marginBottom: 12,
		lineHeight: 24,
		fontFamily: "Inter_400Regular",
	},
	locationContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 8,
		backgroundColor: "#f7f3f1",
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
	},
	locationText: {
		color: "#4c463f",
		fontSize: 12,
		fontWeight: "500",
		flex: 1,
		fontFamily: "Inter_500Medium",
		letterSpacing: 0.5,
	},
	rsvpChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#f7f3f1",
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
		marginBottom: 8,
	},
	rsvpText: {
		color: "#4c463f",
		fontSize: 12,
		fontWeight: "500",
		fontFamily: "Inter_500Medium",
		letterSpacing: 0.5,
	},
	footer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 12,
		gap: 12,
	},
	// --- JOIN BUTTON STYLES ---
	joinButton: {
		flex: 1,
		backgroundColor: "#221d18",
		paddingVertical: 14,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	joinButtonText: {
		color: "#D8CFC0",
		fontWeight: "600",
		fontSize: 14,
		fontFamily: "Inter_600SemiBold",
		letterSpacing: 0.3,
	},
	joinedButton: {
		backgroundColor: "transparent",
		borderWidth: 1.5,
		borderColor: "#221d18",
	},
	joinedButtonText: {
		color: "#221d18",
	},
	// --- HYPE BUTTON STYLES ---
	hypeButton: {
		minWidth: 48,
		height: 48,
		paddingHorizontal: 12,
		borderWidth: 1.5,
		borderColor: "#221d18",
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	hypedButton: {
		backgroundColor: "#38322C",
		borderWidth: 0,
	},
	hypeContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	hypeButtonText: {
		color: "#38322C",
		fontWeight: "bold",
		fontSize: 12,
		fontFamily: "Inter_700Bold",
	},
	hypeButtonTextActive: {
		color: "#D8CFC0",
		fontWeight: "bold",
		fontSize: 10,
		fontFamily: "Inter_700Bold",
	},
});
