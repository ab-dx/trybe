import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
import { ActivityCard, ActivityProps } from "../components/ActivityCard";
import { useAuth } from "../lib/auth/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.112.219.33:3000";

interface FeedScreenProps {
  onJumpToMap: (lat: number, lng: number) => void;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ onJumpToMap }) => {
  const { user } = useAuth();

  const [activities, setActivities] = useState<ActivityProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async () => {
    try {
      const queryParams = "?minLat=00.0&maxLat=90.0&minLng=00.0&maxLng=180.0";

      const response = await fetch(`${API_URL}/activities${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        `Bypassed time filter. Fetched ${data.length} activities via spatial query.`
      );
      setActivities(data);
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  // --- NEW: RSVP Handler ---
  const handleJoin = async (activityId: string) => {
    if (!user) {
      Alert.alert("Not logged in", "You must be logged in to join an activity.");
      return;
    }

    try {
      // Get the current Firebase JWT
      // @ts-ignore - Assuming Firebase Auth standard user object
      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/activities/${activityId}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Pass token to NestJS AuthGuard
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to join activity");
      }

      Alert.alert("Success!", "You have joined the activity. Check your profile for upcoming RSVPs.");
      
      // Optionally refresh the feed if your API returns updated RSVP counts
      // fetchFeed(); 
    } catch (error: any) {
      console.error("Error joining activity:", error);
      Alert.alert("Could not join", error.message || "An unexpected error occurred.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>The Feed</Text>
        <Text style={styles.headerSubtitle}>See what the Trybe is up to.</Text>
      </View>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard
            activity={item}
            onPressLocation={() => {
              const [lng, lat] = item.location.coordinates;
              onJumpToMap(lat, lng);
            }}
            // --- NEW: Pass the handler to the card ---
            onPressJoin={() => handleJoin(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={["#6366f1"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No activities live right now.</Text>
            <Text style={styles.emptySubtitle}>Time to host one yourself?</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080e1f",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    color: "#64748b",
    fontSize: 18,
  },
  emptySubtitle: {
    color: "#475569",
    marginTop: 8,
    fontSize: 14,
  },
});