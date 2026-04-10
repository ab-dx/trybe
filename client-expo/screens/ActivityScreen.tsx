import { View, Text, StyleSheet } from "react-native";
import CreateActivity from "../components/CreateActivity";

export const ActivityScreen: React.FC = () => {
	return (
		<View style={styles.container}>
			<CreateActivity />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#080e1f",
	},
});
