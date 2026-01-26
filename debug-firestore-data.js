/**
 * Debug script to identify data inconsistencies in Firestore
 * Run this with: node debug-firestore-data.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

// Firebase configuration - load from environment or hardcode for debugging
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugFirestoreData() {
  console.log('🔍 Starting Firestore data consistency check...\n');

  // 1. Get all users
  console.log('📋 Fetching all users...');
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = [];
  usersSnapshot.forEach((doc) => {
    const userData = doc.data();
    users.push({
      id: doc.id,
      name: userData.name,
      email: userData.email,
      username: userData.username,
      avatar: userData.avatar,
    });
    console.log(`  ✅ User: ${doc.id}`);
    console.log(`     Name: ${userData.name}`);
    console.log(`     Email: ${userData.email}`);
    console.log(`     Username: ${userData.username}\n`);
  });

  // 2. Get all conversations
  console.log('\n📋 Fetching all conversations...');
  const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
  const conversations = [];
  
  for (const convDoc of conversationsSnapshot.docs) {
    const convData = convDoc.data();
    console.log(`\n  🔍 Conversation: ${convDoc.id}`);
    console.log(`     Type: ${convData.type}`);
    console.log(`     Participants (IDs): ${JSON.stringify(convData.participants)}`);

    // Validate participants exist
    const participantDetails = [];
    for (const participantId of convData.participants || []) {
      const userDoc = await getDoc(doc(db, 'users', participantId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        participantDetails.push({
          id: participantId,
          name: userData.name,
          email: userData.email,
        });
        console.log(`     ✅ Participant: ${participantId} (${userData.name}, ${userData.email})`);
      } else {
        console.log(`     ❌ ERROR: Participant ${participantId} NOT FOUND in users collection!`);
      }
    }

    conversations.push({
      id: convDoc.id,
      type: convData.type,
      participants: convData.participants,
      participantDetails,
    });
  }

  // 3. Check for inconsistencies
  console.log('\n\n🔍 Checking for data inconsistencies...\n');
  
  let issuesFound = 0;

  // Check for conversations with missing participants
  for (const conv of conversations) {
    if (conv.participants.length !== conv.participantDetails.length) {
      issuesFound++;
      console.log(`❌ ISSUE ${issuesFound}: Conversation ${conv.id} has missing participants!`);
      console.log(`   Expected ${conv.participants.length} participants, but only found ${conv.participantDetails.length}`);
      console.log(`   Participant IDs: ${JSON.stringify(conv.participants)}`);
      console.log(`   Found participants: ${JSON.stringify(conv.participantDetails.map(p => p.id))}\n`);
    }

    // For DM conversations, check if it has exactly 2 participants
    if (conv.type === 'dm' && conv.participants.length !== 2) {
      issuesFound++;
      console.log(`❌ ISSUE ${issuesFound}: DM conversation ${conv.id} should have 2 participants but has ${conv.participants.length}`);
      console.log(`   Participants: ${JSON.stringify(conv.participantDetails)}\n`);
    }
  }

  // Check for duplicate participants in conversations
  for (const conv of conversations) {
    const uniqueParticipants = [...new Set(conv.participants)];
    if (uniqueParticipants.length !== conv.participants.length) {
      issuesFound++;
      console.log(`❌ ISSUE ${issuesFound}: Conversation ${conv.id} has duplicate participants!`);
      console.log(`   Participants: ${JSON.stringify(conv.participants)}\n`);
    }
  }

  if (issuesFound === 0) {
    console.log('✅ No data inconsistencies found!');
  } else {
    console.log(`\n⚠️  Total issues found: ${issuesFound}`);
  }

  console.log('\n✅ Debug script completed!');
  process.exit(0);
}

debugFirestoreData().catch((error) => {
  console.error('❌ Error running debug script:', error);
  process.exit(1);
});
