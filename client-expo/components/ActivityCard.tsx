import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";

export interface ActivityProps {
	id: string;
	title: string;
	description?: string;
	startTime: string;
	status: string;
	location: {
		type: string;
		coordinates: [number, number]; // [longitude, latitude]
	};
	host: {
		id: string;
		username?: string;
		displayName?: string;
		trustScore?: number;
	};
}

export interface ActivityCardProps {
	activity: ActivityProps;
	onPressLocation: () => void;
	onPressJoin: () => void;
	isJoined?: boolean; // NEW: Tells the card if the user is already RSVP'd
	isJoining?: boolean; // NEW: Prevents spam clicks while the network request is inflight
	isHostedByMe?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
	activity,
	onPressLocation,
	onPressJoin,
	isJoined = false, // Default to false if not provided
	isJoining = false,
	isHostedByMe = false,
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
		activity.host?.username || activity.host?.displayName || "Unknown Host";
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
					<Text style={styles.hostName}>{hostDisplayName}</Text>
				</View>

				<View style={styles.trustBadge}>
					<Text style={styles.trustText}>
						Trust:{" "}
						{activity.host?.trustScore !== undefined
							? activity.host.trustScore
							: 100}
					</Text>
				</View>
			</View>

			{/* Body: Title & Details */}
			<Text style={styles.title}>{activity.title}</Text>

			<TouchableOpacity
				style={styles.locationContainer}
				onPress={onPressLocation}
				activeOpacity={0.6}
			>
				<Text style={styles.locationIcon}>📍</Text>
				<Text style={styles.locationText} numberOfLines={1}>
					{address}
				</Text>
			</TouchableOpacity>

			{activity.description ? (
				<Text style={styles.description} numberOfLines={2}>
					{activity.description}
				</Text>
			) : null}

			{/* Footer: Time & Actions */}
			<View style={styles.footer}>
				<View style={styles.timeInfo}>
					<Text style={styles.timeIcon}>📅</Text>
					<Text style={styles.timeText}>
						{formattedDate} • {formattedTime}
					</Text>
				</View>

				<View style={styles.actionContainer}>
					<TouchableOpacity style={styles.hypeButton} activeOpacity={0.7}>
						<Text style={styles.hypeButtonText}>🔥 Hype</Text>
					</TouchableOpacity>

					{/* NEW: Dynamic Join Button */}
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
								color="#ffffff"
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
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: "rgba(30, 41, 59, 0.8)",
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#334155",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 3,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	hostInfo: {
		flexDirection: "row",
		alignItems: "center",
	},
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#6366f1",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},
	avatarText: {
		color: "#ffffff",
		fontWeight: "bold",
	},
	hostName: {
		color: "#cbd5e1",
		fontWeight: "500",
	},
	trustBadge: {
		backgroundColor: "rgba(16, 185, 129, 0.2)",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: "rgba(16, 185, 129, 0.3)",
	},
	trustText: {
		color: "#34d399",
		fontSize: 12,
		fontWeight: "bold",
	},
	title: {
		color: "#ffffff",
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 6,
	},
	locationContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	locationIcon: {
		marginRight: 6,
		fontSize: 14,
	},
	locationText: {
		color: "#38bdf8",
		fontSize: 14,
		fontWeight: "500",
		flex: 1,
	},
	description: {
		color: "#94a3b8",
		fontSize: 14,
		marginBottom: 16,
		lineHeight: 20,
	},
	footer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 8,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "#334155",
	},
	timeInfo: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	timeIcon: {
		marginRight: 8,
		color: "#818cf8",
	},
	timeText: {
		color: "#cbd5e1",
		fontSize: 13,
		fontWeight: "600",
	},
	actionContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	hypeButton: {
		backgroundColor: "rgba(99, 102, 241, 0.1)",
		borderWidth: 1,
		borderColor: "rgba(99, 102, 241, 0.4)",
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		marginRight: 8,
	},
	hypeButtonText: {
		color: "#818cf8",
		fontWeight: "bold",
		fontSize: 13,
	},
	// --- JOIN BUTTON STYLES ---
	joinButton: {
		backgroundColor: "#4f46e5",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		minWidth: 70, // Prevents button shrinking when text changes to "Joined"
		alignItems: "center",
		justifyContent: "center",
	},
	joinButtonText: {
		color: "#ffffff",
		fontWeight: "bold",
		fontSize: 13,
	},
	// Add these new styles for the disabled state
	joinedButton: {
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: "#475569",
	},
	joinedButtonText: {
		color: "#94a3b8",
	},
});
