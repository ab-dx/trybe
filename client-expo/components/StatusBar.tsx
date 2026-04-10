import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";

type TabName = "Feed" | "Map" | "Activity" | "Profile";

interface StatusBarProps {
	activeTab: TabName;
	onTabPress: (tab: TabName) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
	activeTab,
	onTabPress,
}) => {
	const tabs: TabName[] = ["Feed", "Map", "Activity", "Profile"];
	const getIcon = (tab: TabName) => {
		if (tab == "Feed") return "align-center";
		else if (tab == "Map") return "map-pin";
		else if (tab == "Activity") return "aperture";
		else if (tab == "Profile") return "user";
	};

	return (
		<View style={styles.container}>
			{tabs.map((tab) => (
				<TouchableOpacity
					key={tab}
					style={[styles.tab, activeTab === tab && styles.activeTab]}
					onPress={() => onTabPress(tab)}
				>
					<Feather
						name={getIcon(tab)}
						size={24}
						color={activeTab === tab ? "white" : "grey"}
					/>
					<Text
						style={[styles.tabText, activeTab === tab && styles.activeTabText]}
					>
						{tab}
					</Text>
				</TouchableOpacity>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		backgroundColor: "#1e293b",
		borderTopWidth: 1,
		borderTopColor: "#334155",
		paddingBottom: 8,
	},
	tab: {
		flex: 1,
		paddingVertical: 16,
		alignItems: "center",
	},
	activeTab: {
		borderTopWidth: 2,
		borderTopColor: "#3396ff",
	},
	tabText: {
		fontSize: 12,
		color: "#9ca3af",
		fontWeight: "500",
		paddingTop: 6,
	},
	activeTabText: {
		color: "#3396ff",
		fontWeight: "600",
	},
});
