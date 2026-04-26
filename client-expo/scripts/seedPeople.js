/**
 * Seed script — Run with: node scripts/seedPeople.js
 *
 * Populates the Firestore 'people' collection with sample users
 * clustered around IIT Patna, Bihta, Bihar (25.5354°N, 84.8513°E)
 *
 * Prerequisites:
 *   npm install firebase   (already installed in this project)
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, GeoPoint } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyB50YOXS9rXPvGKaS7PjVtk59S-R77sMtc',
  authDomain: 'trybe-fc199.firebaseapp.com',
  projectId: 'trybe-fc199',
  storageBucket: 'trybe-fc199.firebasestorage.app',
  messagingSenderId: '701825464156',
  appId: '1:701825464156:web:86d561874b4b2140ddb399',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// IIT Patna center: 25.5354, 84.8513
const IIT_PATNA = { lat: 25.5354, lng: 84.8513 };

// Helper: offset from center by a small random amount (~0.5–3 km)
function jitter(center, radiusKm = 2) {
  const degPerKm = 1 / 111; // rough approximation
  const angle = Math.random() * 2 * Math.PI;
  const dist = (Math.random() * 0.7 + 0.3) * radiusKm * degPerKm;
  return {
    latitude: center.lat + dist * Math.sin(angle),
    longitude: center.lng + dist * Math.cos(angle),
  };
}

const samplePeople = [
  {
    name: 'Arjun Sharma',
    bio: 'Full-stack dev who runs marathons on weekends. Always up for a coding session or a trail run.',
    hobbies: ['Running', 'Coding', 'Photography'],
    streakCount: 42,
  },
  {
    name: 'Priya Patel',
    bio: 'Yoga instructor by morning, data scientist by afternoon. Loves chai and deep learning.',
    hobbies: ['Yoga', 'Data Science', 'Reading'],
    streakCount: 87,
  },
  {
    name: 'Rahul Verma',
    bio: 'Guitar player and open-source contributor. Building cool stuff, one commit at a time.',
    hobbies: ['Guitar', 'Open Source', 'Gaming'],
    streakCount: 23,
  },
  {
    name: 'Sneha Gupta',
    bio: 'Competitive programmer who paints in watercolors. Finding beauty in algorithms.',
    hobbies: ['Competitive Programming', 'Painting', 'Cycling'],
    streakCount: 156,
  },
  {
    name: 'Vikram Singh',
    bio: 'Fitness enthusiast and robotics nerd. Building the future, one rep at a time.',
    hobbies: ['Gym', 'Robotics', 'Chess'],
    streakCount: 64,
  },
  {
    name: 'Ananya Das',
    bio: 'Amateur astronomer and professional procrastinator. Stargazing > deadlines.',
    hobbies: ['Astronomy', 'Sketching', 'Badminton'],
    streakCount: 31,
  },
  {
    name: 'Karthik Rajan',
    bio: 'Mechanical engineer who loves cooking south Indian food. Will trade dosas for debugging help.',
    hobbies: ['Cooking', 'Basketball', 'IoT Projects'],
    streakCount: 19,
  },
  {
    name: 'Meera Iyer',
    bio: 'Classical dancer and ML researcher. Teaching machines to understand art.',
    hobbies: ['Bharatanatyam', 'Machine Learning', 'Pottery'],
    streakCount: 73,
  },
  {
    name: 'Aditya Kumar',
    bio: 'Biker and blockchain enthusiast. Rides through Bihar on weekends, codes on weekdays.',
    hobbies: ['Biking', 'Crypto', 'Trekking'],
    streakCount: 55,
  },
  {
    name: 'Riya Bhardwaj',
    bio: 'Content creator and UI designer. Making the internet a prettier place.',
    hobbies: ['UI Design', 'Vlogging', 'Calligraphy'],
    streakCount: 38,
  },
];

async function seed() {
  console.log('🌱 Seeding people collection near IIT Patna...\n');

  const peopleRef = collection(db, 'people');

  for (const person of samplePeople) {
    const loc = jitter(IIT_PATNA, 2.5);
    const doc = {
      ...person,
      avatar: null,
      location: new GeoPoint(loc.latitude, loc.longitude),
    };

    const ref = await addDoc(peopleRef, doc);
    console.log(`  ✅ ${person.name} → ${ref.id} (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`);
  }

  console.log('\n🎉 Done! Seeded', samplePeople.length, 'people.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
