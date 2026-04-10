import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface ActivityProps {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  status: string;
  host: {
    id: string;
    username?: string;
    trustScore?: number;
  };
}

export const ActivityCard: React.FC<{ activity: ActivityProps }> = ({ activity }) => {
  const dateObj = new Date(activity.startTime);
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <View style={styles.card}>
      {/* Header: Host & Trust Score */}
      <View style={styles.header}>
        <View style={styles.hostInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {activity.host?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.hostName}>
            {activity.host?.username || 'Unknown Host'}
          </Text>
        </View>

        <View style={styles.trustBadge}>
          <Text style={styles.trustText}>
            Trust: {activity.host?.trustScore !== undefined ? activity.host.trustScore : 100}
          </Text>
        </View>
      </View>

      {/* Body: Title & Details */}
      <Text style={styles.title}>{activity.title}</Text>
      {activity.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {activity.description}
        </Text>
      ) : null}

      {/* Footer: Time & Action */}
      <View style={styles.footer}>
        <View style={styles.timeInfo}>
          <Text style={styles.timeIcon}>🕒</Text>
          <Text style={styles.timeText}>
            {formattedDate} • {formattedTime}
          </Text>
        </View>

        <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>Hype / Join</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  hostName: {
    color: '#cbd5e1',
    fontWeight: '500',
  },
  trustBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  trustText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: 8,
    color: '#818cf8',
  },
  timeText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});