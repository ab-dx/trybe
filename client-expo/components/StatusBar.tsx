import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type TabName = 'Feed' | 'Map' | 'Activity';

interface StatusBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ activeTab, onTabPress }) => {
  const tabs: TabName[] = ['Feed', 'Map', 'Activity'];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => onTabPress(tab)}>
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#007aff',
  },
  tabText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007aff',
    fontWeight: '600',
  },
});
