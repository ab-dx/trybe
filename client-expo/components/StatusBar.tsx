import { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type TabName = "Feed" | "Map" | "Activity" | "Profile";

interface StatusBarProps {
	activeTab: TabName;
	onTabPress: (tab: TabName) => void;
}

const AnimatedTab: React.FC<{
	tab: TabName;
	isActive: boolean;
	icon: keyof typeof MaterialIcons.glyphMap;
	onPress: () => void;
}> = ({ tab, isActive, icon, onPress }) => {
	const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.9)).current;
	const bgOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

	useEffect(() => {
		Animated.spring(scaleAnim, {
			toValue: isActive ? 1 : 0.9,
			useNativeDriver: true,
			speed: 20,
			bounciness: 12,
		}).start();

		Animated.timing(bgOpacity, {
			toValue: isActive ? 1 : 0,
			duration: 200,
			useNativeDriver: false,
		}).start();
	}, [isActive]);

	return (
		<TouchableOpacity style={styles.tabWrapper} onPress={onPress} activeOpacity={0.7}>
			<Animated.View style={[styles.tab, { transform: [{ scale: scaleAnim }] }]}>
				<Animated.View
					style={[StyleSheet.absoluteFill, styles.tabBg, { opacity: bgOpacity }]}
				/>
				<MaterialIcons
					name={icon}
					size={24}
					color={isActive ? "#38322C" : "rgba(56, 50, 44, 0.4)"}
				/>
				<Text style={[styles.tabText, isActive && styles.activeTabText]}>
					{tab.toUpperCase()}
				</Text>
			</Animated.View>
		</TouchableOpacity>
	);
};

export const StatusBar: React.FC<StatusBarProps> = ({ activeTab, onTabPress }) => {
	const tabs: TabName[] = ["Feed", "Map", "Activity", "Profile"];
	const getIcon = (tab: TabName): keyof typeof MaterialIcons.glyphMap => {
		if (tab === "Feed") return "dynamic-feed";
		if (tab === "Map") return "map";
		if (tab === "Activity") return "explore";
		return "person";
	};

	return (
		<View style={styles.container}>
			{tabs.map((tab) => (
				<AnimatedTab
					key={tab}
					tab={tab}
					isActive={activeTab === tab}
					icon={getIcon(tab)}
					onPress={() => onTabPress(tab)}
				/>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		backgroundColor: "#D8CFC0",
		borderTopWidth: 1,
		borderTopColor: "rgba(56, 50, 44, 0.05)",
		paddingBottom: 24,
		paddingTop: 8,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		shadowColor: "rgba(56, 50, 44, 0.08)",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 1,
		shadowRadius: 16,
		elevation: 8,
	},
	tabWrapper: {
		flex: 1,
		alignItems: "center",
	},
	tab: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		alignItems: "center",
		borderRadius: 12,
		minWidth: 64,
		overflow: "hidden",
	},
	tabBg: {
		backgroundColor: "#E2DACF",
		borderRadius: 12,
	},
	tabText: {
		fontSize: 10,
		color: "rgba(56, 50, 44, 0.4)",
		fontWeight: "700",
		paddingTop: 4,
		letterSpacing: 1,
		fontFamily: "Inter_700Bold",
	},
	activeTabText: {
		color: "#38322C",
	},
});
