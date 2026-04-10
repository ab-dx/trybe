import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth/AuthContext';
import { fetchProfile } from '../lib/api';

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  status: string;
  host?: { displayName?: string; email?: string };
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
  upcomingActivities: ActivityItem[];
  pastActivities: ActivityItem[];
}

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchProfile();
      // Normalize with safe defaults so the UI never crashes on missing fields
      setProfile({
        ...data,
        trustScore: data.trustScore ?? 0,
        activitiesHosted: data.activitiesHosted ?? 0,
        activitiesJoined: data.activitiesJoined ?? 0,
        checkIns: data.checkIns ?? 0,
        upcomingActivities: data.upcomingActivities ?? [],
        pastActivities: data.pastActivities ?? [],
      });
    } catch (err: any) {
      setError('Could not load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
  };

  const getInitial = (name?: string | null) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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
        <Text style={styles.errorText}>{error || 'Failed to load profile'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = [
    { label: 'Trust Score', value: profile.trustScore, icon: 'shield-checkmark-outline' as const, color: '#10b981' },
    { label: 'Hosted', value: profile.activitiesHosted, icon: 'flag-outline' as const, color: '#f59e0b' },
    { label: 'Joined', value: profile.activitiesJoined, icon: 'people-outline' as const, color: '#3b82f6' },
    { label: 'Check-ins', value: profile.checkIns, icon: 'location-outline' as const, color: '#8b5cf6' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3396ff" />}
    >
      {/* ── Profile Header ── */}
      <View style={styles.header}>
        <View style={styles.avatarGlow}>
          {user?.photoURL || profile.avatarUrl ? (
            <Image source={{ uri: user?.photoURL || profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {getInitial(profile.displayName || profile.email)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.displayName}>
          {profile.displayName || 'Trybe Member'}
        </Text>
        <Text style={styles.email}>{profile.email}</Text>
        <View style={styles.memberSince}>
          <Feather name="calendar" size={13} color="#64748b" />
          <Text style={styles.memberSinceText}>
            Joined {formatDate(profile.createdAt)}
          </Text>
        </View>
      </View>

      {/* ── Stats Grid ── */}
      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon} size={22} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Upcoming Activities ── */}
      <View style={styles.sectionHeader}>
        <Feather name="clock" size={18} color="#3396ff" />
        <Text style={styles.sectionTitle}>Upcoming Activities</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{profile.upcomingActivities.length}</Text>
        </View>
      </View>
      {profile.upcomingActivities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={36} color="#334155" />
          <Text style={styles.emptyText}>No upcoming activities</Text>
          <Text style={styles.emptySubtext}>Join an event from the Map or Feed!</Text>
        </View>
      ) : (
        profile.upcomingActivities.map((a) => (
          <View key={a.id} style={styles.activityCard}>
            <View style={styles.activityIndicator} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{a.title}</Text>
              <View style={styles.activityMeta}>
                <Feather name="clock" size={12} color="#64748b" />
                <Text style={styles.activityTime}>{formatTime(a.startTime)}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, styles.statusUpcoming]}>
              <Text style={styles.statusText}>{a.status}</Text>
            </View>
          </View>
        ))
      )}

      {/* ── Past Activities ── */}
      <View style={[styles.sectionHeader, { marginTop: 28 }]}>
        <Feather name="archive" size={18} color="#8b5cf6" />
        <Text style={styles.sectionTitle}>Past Activities</Text>
        <View style={[styles.badge, { backgroundColor: '#1e1b4b' }]}>
          <Text style={[styles.badgeText, { color: '#8b5cf6' }]}>{profile.pastActivities.length}</Text>
        </View>
      </View>
      {profile.pastActivities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={36} color="#334155" />
          <Text style={styles.emptyText}>No past activities yet</Text>
        </View>
      ) : (
        profile.pastActivities.map((a) => (
          <View key={a.id} style={[styles.activityCard, { opacity: 0.75 }]}>
            <View style={[styles.activityIndicator, { backgroundColor: '#8b5cf6' }]} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{a.title}</Text>
              <View style={styles.activityMeta}>
                <Feather name="check-circle" size={12} color="#64748b" />
                <Text style={styles.activityTime}>{formatTime(a.startTime)}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, styles.statusPast]}>
              <Text style={[styles.statusText, { color: '#8b5cf6' }]}>DONE</Text>
            </View>
          </View>
        ))
      )}

      {/* ── Friends ── */}
      <View style={[styles.sectionHeader, { marginTop: 28 }]}>
        <Feather name="users" size={18} color="#f59e0b" />
        <Text style={styles.sectionTitle}>Friends</Text>
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      </View>
      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={36} color="#334155" />
        <Text style={styles.emptyText}>Friends feature is on the way!</Text>
        <Text style={styles.emptySubtext}>You'll be able to follow and find friends here.</Text>
      </View>

      {/* ── Sign Out ── */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080e1f' },
  content: { paddingBottom: 40 },

  /* Loading / Error */
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#080e1f' },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },
  errorText: { color: '#ef4444', marginTop: 12, fontSize: 16 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#1e293b', borderRadius: 8 },
  retryText: { color: '#3396ff', fontWeight: '600' },

  /* Header */
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  avatarGlow: {
    width: 92, height: 92, borderRadius: 46,
    backgroundColor: '#1e293b',
    borderWidth: 3, borderColor: '#3396ff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#3396ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarFallback: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#334155',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
  displayName: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 14 },
  email: { color: '#64748b', fontSize: 14, marginTop: 4 },
  memberSince: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  memberSinceText: { color: '#64748b', fontSize: 12 },

  /* Stats */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 20, gap: 10 },
  statCard: {
    flex: 1, minWidth: '44%',
    backgroundColor: '#0f172a',
    borderRadius: 14, borderWidth: 1, borderColor: '#1e293b',
    paddingVertical: 16, paddingHorizontal: 12,
    alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Section Headers */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1 },
  badge: { backgroundColor: '#0c2d5a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#3396ff', fontSize: 12, fontWeight: '700' },
  comingSoon: { backgroundColor: '#422006', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  comingSoonText: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },

  /* Activity Cards */
  activityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f172a',
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#1e293b',
    overflow: 'hidden',
  },
  activityIndicator: { width: 4, alignSelf: 'stretch', backgroundColor: '#3396ff' },
  activityInfo: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  activityTitle: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  activityTime: { color: '#64748b', fontSize: 12 },
  statusBadge: { marginRight: 14, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusUpcoming: { backgroundColor: '#0c2d5a' },
  statusPast: { backgroundColor: '#1e1b4b' },
  statusText: { color: '#3396ff', fontSize: 10, fontWeight: '700' },

  /* Empty States */
  emptyState: {
    alignItems: 'center', paddingVertical: 28,
    marginHorizontal: 16, backgroundColor: '#0f172a',
    borderRadius: 12, borderWidth: 1, borderColor: '#1e293b',
  },
  emptyText: { color: '#475569', fontSize: 14, fontWeight: '600', marginTop: 8 },
  emptySubtext: { color: '#334155', fontSize: 12, marginTop: 4 },

  /* Logout */
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 32,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#7f1d1d',
    backgroundColor: '#1a0a0a',
  },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
