# Database Setup Guide

This guide provides detailed instructions for setting up Firebase and Firestore for the Steam Profile Showcase application.

## Overview

The application uses Firebase for authentication and Firestore as the database to store user profiles and showcase data. The database is designed to handle user profiles with customizable themes, layouts, and showcase items.

## Prerequisites

- A Google account
- Node.js and npm installed
- Basic understanding of Firebase console

## Step 1: Create Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "steam-profile-showcase")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, navigate to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Enable **Email/Password** authentication:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Create Firestore Database

1. Navigate to **Firestore Database** in the left sidebar
2. Click "Create database"
3. Choose **Start in test mode** (we'll configure security rules later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## Step 4: Configure Security Rules

Replace the default Firestore security rules with the following:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read public profiles
    match /profiles/{userId} {
      allow read: if resource.data.isPublic == true;
    }
    
    // Allow authenticated users to search public profiles
    match /profiles/{document=**} {
      allow read: if request.auth != null && resource.data.isPublic == true;
    }
  }
}
\`\`\`

To apply these rules:
1. Go to **Firestore Database** → **Rules** tab
2. Replace the existing rules with the code above
3. Click "Publish"

## Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon in the left sidebar)
2. Scroll down to "Your apps" section
3. Click on the web app icon `</>`
4. Register your app with a nickname (e.g., "steam-showcase-web")
5. Copy the Firebase configuration object

## Step 6: Environment Variables

Create a `.env.local` file in your project root and add your Firebase configuration:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

**Important:** Never commit the `.env.local` file to version control. It's already included in `.gitignore`.

## Database Schema

### Collection: `profiles`

Each document represents a user profile with the following structure:

#### Document ID
- Uses the Firebase Auth user ID as the document ID

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID (same as userId) |
| `userId` | string | Firebase Auth user ID |
| `email` | string | User's email address |
| `profileName` | string | Display name for the profile |
| `profileDescription` | string | Profile description/bio |
| `profilePicture` | string | URL or path to profile picture |
| `layout` | string | Layout type: "default", "minimal", "grid", "masonry", "spotlight" |
| `backgroundColor` | string | Hex color code for background |
| `backgroundImage` | string | URL or path to background image |
| `contentBoxColor` | string | Hex color code for content boxes |
| `contentBoxTrimColor` | string | Hex color code for content box borders |
| `theme` | string | Theme: "light-business", "dark-business", "business-casual" |
| `showcaseItems` | array | Array of showcase items (see below) |
| `resumeFile` | string | URL or path to resume file |
| `isPublic` | boolean | Whether profile is publicly visible |
| `createdAt` | timestamp | Profile creation date |
| `updatedAt` | timestamp | Last update date |
| `searchKeywords` | array | Generated keywords for search functionality |

#### ShowcaseItem Structure

Each item in the `showcaseItems` array has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the item |
| `type` | string | Item type: "image", "video", "text" |
| `content` | string | URL/path for media or text content |
| `title` | string | Item title |
| `description` | string | Item description |

## Default Profile Creation

When a new user signs up, the application automatically creates a default profile with:

- Professional theme and layout
- Sample showcase items
- Public visibility enabled
- Generated search keywords

## Database Operations

The application provides these main operations:

### Create/Update Profile
\`\`\`typescript
await saveUserProfile(userId, profileData)
\`\`\`

### Get User Profile
\`\`\`typescript
const profile = await getUserProfile(userId)
\`\`\`

### Search Public Profiles
\`\`\`typescript
const results = await searchProfiles("keyword", maxResults)
\`\`\`

### Get All Public Profiles
\`\`\`typescript
const profiles = await getPublicProfiles(maxResults)
\`\`\`

### Delete Profile (Soft Delete)
\`\`\`typescript
await deleteUserProfile(userId)
\`\`\`

## Error Handling

The application includes comprehensive error handling for:

- Missing Firebase configuration
- Permission denied errors
- Network connectivity issues
- Invalid data structures

When Firebase is not configured, the app will:
- Show warning messages in the console
- Continue to function with limited features
- Display appropriate user feedback

## Testing Your Setup

1. Start your development server: `npm run dev`
2. Navigate to your application
3. Try creating a new account
4. Verify that a profile is automatically created
5. Test profile editing functionality
6. Check the Firestore console to see the created data

## Troubleshooting

### Common Issues

**"Missing or insufficient permissions" error:**
- Check that Firestore security rules are properly configured
- Ensure the user is authenticated before accessing their profile
- Verify that `isPublic` is set to `true` for profiles that should be publicly accessible

**Firebase not initialized:**
- Verify all environment variables are set correctly
- Check that the Firebase project ID matches your actual project
- Ensure the web app is properly registered in Firebase console

**Profile not loading:**
- Check browser console for error messages
- Verify the user is authenticated
- Check Firestore console to see if the profile document exists

### Debug Mode

The application includes debug logging. Check your browser console for messages starting with `[v0]` to track:
- Profile loading status
- Authentication state
- Database operations
- Error conditions

## Security Best Practices

1. **Never expose Firebase config secrets** - All config values in this setup are safe to expose publicly
2. **Use proper security rules** - The provided rules ensure users can only edit their own profiles
3. **Validate data on the client** - The app includes proper TypeScript types and validation
4. **Monitor usage** - Use Firebase console to monitor database usage and costs
5. **Regular backups** - Consider setting up automated Firestore backups for production

## Production Deployment

When deploying to production:

1. Update Firestore security rules if needed
2. Set up proper domain authentication in Firebase console
3. Configure environment variables in your hosting platform
4. Monitor performance and usage in Firebase console
5. Consider upgrading to a paid Firebase plan based on usage

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Test with a fresh user account
4. Check Firestore security rules
5. Review the Firebase console for any service issues

For additional help, refer to the [Firebase documentation](https://firebase.google.com/docs) or create an issue in the project repository.
