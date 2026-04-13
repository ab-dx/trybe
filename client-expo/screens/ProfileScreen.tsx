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
import { fetchProfile, fetchMyRsvps } from '../lib/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  status: string;
  host?: { displayName?: string; email?: string };
}

interface RsvpItem {
  id: string;
  checkedIn: boolean;
  activity: ActivityItem;
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

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  
  // State for the RSVPs fetched from /users/me/rsvps
  const [upcomingRsvps, setUpcomingRsvps] = useState<RsvpItem[]>([]);
  const [pastRsvps, setPastRsvps] = useState<RsvpItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfileData = useCallback(async () => {
    try {
      setError(null);
      
      // 1. Fetch General Profile Stats (from /users/me)
      const profileData = await fetchProfile();
      setProfile({
        ...profileData,
        trustScore: profileData.trustScore ?? 0,
        activitiesHosted: profileData.activitiesHosted ?? 0,
        activitiesJoined: profileData.activitiesJoined ?? 0,
        checkIns: profileData.checkIns ?? 0,
      });

      // 2. Fetch User RSVPs (from your existing /users/me/rsvps)
      if (user) {
        // @ts-ignore - Assuming Firebase Auth
        const token = await user.getIdToken();
        // const rsvpResponse = await fetch(`${API_URL}/users/me/rsvps`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
      
        const rsvpResponse = await fetchMyRsvps();
        console.log(JSON.stringify(rsvpResponse));
        const rsvps: RsvpItem[] = await rsvpResponse;
        const now = new Date();
        console.log(JSON.stringify(rsvpResponse));
        // Split into upcoming and past based on the nested activity's start time
        const upcoming = rsvps.filter(r => r.activity && new Date(r.activity.startTime) >= now);
        const past = rsvps.filter(r => r.activity && new Date(r.activity.startTime) < now);
        setUpcomingRsvps(upcoming);
        setPastRsvps(past);
      }
    } catch (err: any) {
      setError('Could not load profile data');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

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

  const getInitial = (name?: string | null) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
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
        <TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
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
        <Text style={styles.displayName}>{profile.displayName || 'Trybe Member'}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        <View style={styles.memberSince}>
          <Feather name="calendar" size={13} color="#64748b" />
          <Text style={styles.memberSinceText}>Joined {formatDate(profile.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon} size={22} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Upcoming RSVPs ── */}
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
          <Text style={styles.emptySubtext}>Join an event from the Map or Feed!</Text>
        </View>
      ) : (
        upcomingRsvps.map((rsvp) => (
          <View key={rsvp.id} style={styles.activityCard}>
            <View style={styles.activityIndicator} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{rsvp.activity.title}</Text>
              <View style={styles.activityMeta}>
                <Feather name="clock" size={12} color="#64748b" />
                <Text style={styles.activityTime}>{formatTime(rsvp.activity.startTime)}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, styles.statusUpcoming]}>
              <Text style={styles.statusText}>{rsvp.activity.status}</Text>
            </View>
          </View>
        ))
      )}

      {/* ── Past RSVPs & Check-ins ── */}
      <View style={[styles.sectionHeader, { marginTop: 28 }]}>
        <Feather name="archive" size={18} color="#8b5cf6" />
        <Text style={styles.sectionTitle}>Past Activities</Text>
        <View style={[styles.badge, { backgroundColor: '#1e1b4b' }]}>
          <Text style={[styles.badgeText, { color: '#8b5cf6' }]}>{pastRsvps.length}</Text>
        </View>
      </View>
      
      {pastRsvps.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={36} color="#334155" />
          <Text style={styles.emptyText}>No past activities yet</Text>
        </View>
      ) : (
        pastRsvps.map((rsvp) => (
          <View key={rsvp.id} style={[styles.activityCard, { opacity: 0.75 }]}>
            <View style={[styles.activityIndicator, { backgroundColor: rsvp.checkedIn ? '#10b981' : '#8b5cf6' }]} />
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{rsvp.activity.title}</Text>
              <View style={styles.activityMeta}>
                <Feather name="check-circle" size={12} color="#64748b" />
                <Text style={styles.activityTime}>{formatTime(rsvp.activity.startTime)}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, rsvp.checkedIn ? { backgroundColor: '#064e3b' } : styles.statusPast]}>
              <Text style={[styles.statusText, { color: rsvp.checkedIn ? '#10b981' : '#8b5cf6' }]}>
                {rsvp.checkedIn ? 'CHECKED IN' : 'MISSED'}
              </Text>
            </View>
          </View>
        ))
      )}

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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#080e1f' },
  loadingText: { color: '#64748b', marginTop: 12, fontSize: 14 },
  errorText: { color: '#ef4444', marginTop: 12, fontSize: 16 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#1e293b', borderRadius: 8 },
  retryText: { color: '#3396ff', fontWeight: '600' },
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  avatarGlow: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#1e293b', borderWidth: 3, borderColor: '#3396ff', justifyContent: 'center', alignItems: 'center', shadowColor: '#3396ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarFallback: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '700' },
  displayName: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 14 },
  email: { color: '#64748b', fontSize: 14, marginTop: 4 },
  memberSince: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  memberSinceText: { color: '#64748b', fontSize: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 20, gap: 10 },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: '#0f172a', borderRadius: 14, borderWidth: 1, borderColor: '#1e293b', paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center', gap: 4, },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#64748b', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700', flex: 1 },
  badge: { backgroundColor: '#0c2d5a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#3396ff', fontSize: 12, fontWeight: '700' },
  comingSoon: { backgroundColor: '#422006', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  comingSoonText: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', overflow: 'hidden', },
  activityIndicator: { width: 4, alignSelf: 'stretch', backgroundColor: '#3396ff' },
  activityInfo: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  activityTitle: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  activityTime: { color: '#64748b', fontSize: 12 },
  statusBadge: { marginRight: 14, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusUpcoming: { backgroundColor: '#0c2d5a' },
  statusPast: { backgroundColor: '#1e1b4b' },
  statusText: { color: '#3396ff', fontSize: 10, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 28, marginHorizontal: 16, backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', },
  emptyText: { color: '#475569', fontSize: 14, fontWeight: '600', marginTop: 8 },
  emptySubtext: { color: '#334155', fontSize: 12, marginTop: 4 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 32, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#7f1d1d', backgroundColor: '#1a0a0a', },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});