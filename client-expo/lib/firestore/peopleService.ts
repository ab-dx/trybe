import { collection, getDocs, query, GeoPoint } from 'firebase/firestore';
import { db } from '../firebase';

export interface Person {
  id: string;
  name: string;
  bio: string;
  hobbies: string[];
  avatar?: string;
  streakCount: number;
  location: {
    latitude: number;
    longitude: number;
  };
}

const PEOPLE_COLLECTION = 'people';

export const peopleService = {
  async fetchPeople(): Promise<Person[]> {
    try {
      const q = query(collection(db, PEOPLE_COLLECTION));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => {
        const data = doc.data();

        // Handle both GeoPoint and plain {lat, lng} objects
        let latitude: number;
        let longitude: number;

        if (data.location instanceof GeoPoint) {
          latitude = data.location.latitude;
          longitude = data.location.longitude;
        } else if (data.location) {
          latitude = data.location.latitude ?? data.location.lat ?? 0;
          longitude = data.location.longitude ?? data.location.lng ?? 0;
        } else {
          latitude = 0;
          longitude = 0;
        }

        return {
          id: doc.id,
          name: data.name ?? 'Unknown',
          bio: data.bio ?? '',
          hobbies: Array.isArray(data.hobbies) ? data.hobbies : [],
          avatar: data.avatar ?? undefined,
          streakCount: data.streakCount ?? 0,
          location: { latitude, longitude },
        } satisfies Person;
      });
    } catch (error) {
      console.error('Error fetching people:', error);
      throw error;
    }
  },
};
