# Firestore Security Rules Setup

Your Firebase database is set up correctly, but you need to configure Firestore security rules to allow the app to read and write profile data.

## Required Security Rules

Copy and paste these rules into your Firebase Console:

1. Go to Firebase Console → Firestore Database → Rules
2. Replace the existing rules with:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own profiles
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow anyone to read public profiles (for browsing/search)
    match /profiles/{userId} {
      allow read: if resource.data.isPublic == true;
    }
  }
}
\`\`\`

## Optional: Composite Indexes for Better Performance

For optimal performance of the profile search and browsing features, you can create composite indexes. The app will work without these indexes using fallback queries, but performance will be better with them.

### To create the indexes:

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index" and add these two composite indexes:

**Index 1 - For Public Profile Browsing:**
- Collection ID: `profiles`
- Fields:
  - `isPublic` (Ascending)
  - `updatedAt` (Descending)

**Index 2 - For Profile Search:**
- Collection ID: `profiles`  
- Fields:
  - `isPublic` (Ascending)
  - `searchKeywords` (Arrays)
  - `updatedAt` (Descending)

### Alternative: Auto-create indexes from error links

When you see index errors in the console, Firebase provides direct links to create the required indexes. You can click these links to automatically create the indexes.

## What these rules do:

- **Line 4-6**: Allow authenticated users to read and write only their own profile document (where the document ID matches their user ID)
- **Line 8-10**: Allow anyone to read profiles that are marked as public (for the browse/search functionality)

## After adding the rules:

1. Click "Publish" in the Firebase Console
2. The app will automatically start using Firebase instead of local storage
3. Your existing profile data will be loaded from Firebase
4. New profiles will be saved to Firebase

## Troubleshooting:

If you're still getting permission errors after adding the rules:

1. **Check Authentication**: Make sure you're signed in to the app
2. **Wait for Auth State**: The app now waits for authentication to be fully established before making Firestore requests
3. **Check Browser Console**: Look for detailed error logs with authentication and user ID information
4. **Verify Rules**: Make sure the rules were published successfully in Firebase Console

## Current Status:
- ✅ Database structure is correct
- ✅ Profile data exists in Firebase  
- ✅ Enhanced debugging added to identify permission issues
- ✅ Fallback queries implemented for missing indexes
- ❌ Security rules need to be configured (this is the missing piece)

Once you add these security rules, the app will work seamlessly with your Firebase database! The composite indexes are optional but recommended for better performance.
