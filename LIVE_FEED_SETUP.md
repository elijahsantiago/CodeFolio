# Live Feed Setup Guide

This guide provides instructions for setting up Firebase Firestore security rules to support the live feed feature in the Steam Profile Showcase application.

## Overview

The live feed feature allows users to:
- Create public posts with text and optional images
- Like posts from other users
- Comment on posts
- View total post views
- Delete their own posts

## Firestore Collections

### Posts Collection

The live feed uses a `posts` collection with the following structure:

\`\`\`typescript
{
  id: string              // Auto-generated post ID
  userId: string          // ID of user who created the post
  userName: string        // Display name of the user
  userAvatar?: string     // User's avatar URL
  content: string         // Post text content
  imageUrl?: string       // Optional post image
  likes: number           // Total number of likes
  comments: number        // Total number of comments
  views: number           // Total number of views
  createdAt: Timestamp    // When the post was created
}
\`\`\`

### Notifications Collection

The notification system uses a `notifications` collection with the following structure:

\`\`\`typescript
{
  id: string              // Auto-generated notification ID
  type: string            // Type of notification (e.g., "comment_reply")
  toUserId: string        // ID of user receiving the notification
  fromUserId: string      // ID of user who triggered the notification
  fromUserName: string    // Display name of the triggering user
  fromUserAvatar?: string // Avatar of the triggering user
  postId?: string         // Related post ID (for comment replies)
  commentId?: string      // Related comment ID (for replies)
  message: string         // Notification message text
  read: boolean           // Whether notification has been read
  createdAt: Timestamp    // When the notification was created
}
\`\`\`

### Subcollections

Each post has two subcollections:

**Likes Subcollection** (`posts/{postId}/likes/{likeId}`):
\`\`\`typescript
{
  userId: string          // ID of user who liked
  createdAt: Timestamp    // When the like was added
}
\`\`\`

**Comments Subcollection** (`posts/{postId}/comments/{commentId}`):
\`\`\`typescript
{
  id: string              // Auto-generated comment ID
  userId: string          // ID of user who commented
  userName: string        // Display name of the commenter
  userAvatar?: string     // Commenter's avatar URL
  content: string         // Comment text
  createdAt: Timestamp    // When the comment was added
}
\`\`\`

## Security Rules

The live feed requires updated Firestore security rules to allow users to create, read, and interact with posts.

### Applying the Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the contents of `firestore.rules` from this project
6. Paste into the Firebase Console rules editor
7. Click **Publish**

### What the Rules Allow

**Posts Collection:**
- ✅ Anyone can read posts (public feed)
- ✅ Authenticated users can create posts (must match their user ID)
- ✅ Anyone can increment view counts (for tracking post views)
- ✅ Users can update their own posts (other fields)
- ✅ Users can delete their own posts
- ✅ Admins can update or delete any post

**Likes Subcollection:**
- ✅ Anyone can read likes
- ✅ Authenticated users can add likes (must match their user ID)
- ✅ Users can delete their own likes

**Comments Subcollection:**
- ✅ Anyone can read comments
- ✅ Authenticated users can add comments (must match their user ID)
- ✅ Users can update their own comments
- ✅ Users can delete their own comments
- ✅ Admins can delete any comment

**Notifications Collection:**
- ✅ Authenticated users can read their own notifications
- ✅ Authenticated users can mark notifications as read
- ✅ Admins can read and modify all notifications

## Testing the Live Feed

### Test Scenario 1: Create a Post

1. **User A**: Navigate to the "Live Feed" section
2. **User A**: Enter text in the "What's on your mind?" field
3. **User A**: Click "Post" button
4. **Verify**: Post should appear at the top of the feed

### Test Scenario 2: Like a Post

1. **User B**: Navigate to the "Live Feed" section
2. **User B**: Click the heart icon on User A's post
3. **Verify**: Like count should increase by 1
4. **Verify**: Heart icon should turn red
5. **User B**: Click the heart icon again
6. **Verify**: Like count should decrease by 1

### Test Scenario 3: Comment on a Post

1. **User C**: Navigate to the "Live Feed" section
2. **User C**: Click "Comment" on User A's post
3. **User C**: Enter comment text and click "Post Comment"
4. **Verify**: Comment should appear below the post
5. **Verify**: Comment count should increase by 1

### Test Scenario 4: View Tracking

1. **Any User**: Navigate to the "Live Feed" section
2. **Verify**: View count increases when posts are displayed
3. **Note**: Views are tracked automatically when posts load

### Test Scenario 5: Delete a Post

1. **User A**: Navigate to the "Live Feed" section
2. **User A**: Click the trash icon on their own post
3. **User A**: Confirm deletion
4. **Verify**: Post should be removed from the feed

### Test Scenario 6: Receive a Notification

1. **User A**: Post a comment on User B's post
2. **User B**: Navigate to the "Notifications" section
3. **Verify**: Notification appears for User B
4. **Verify**: Notification includes User A's comment and post details

### Test Scenario 7: Mark Notification as Read

1. **User B**: Click on a notification in the "Notifications" section
2. **Verify**: Notification status changes to "Read"

## Troubleshooting

### "Missing or insufficient permissions" Error

If you see this error, it means the Firestore security rules haven't been applied yet:

1. **Check Authentication**: Make sure you're logged in
2. **Verify Rules**: Go to Firebase Console → Firestore Database → Rules
3. **Publish Rules**: Make sure you clicked "Publish" after pasting the rules
4. **Wait**: Rules can take a few seconds to propagate
5. **Refresh**: Reload your application after publishing rules

### Posts Not Appearing

1. **Check Console**: Open browser developer console for error messages
2. **Verify Authentication**: Make sure you're logged in
3. **Check Firestore**: Go to Firebase Console → Firestore Database → Data
4. **Verify Collection**: Make sure the `posts` collection exists
5. **Check Rules**: Verify security rules allow reading posts

### Likes/Comments Not Working

1. **Check Authentication**: Make sure you're logged in
2. **Check Console**: Look for permission errors
3. **Verify Rules**: Make sure subcollection rules are published
4. **Check User ID**: Verify your user ID matches the authenticated user

### View Count Not Updating

1. **Check Console**: Look for any error messages
2. **Verify Rules**: Make sure the updated rules allow view count updates by anyone
3. **Publish Rules**: Ensure you've published the latest `firestore.rules` from the project
4. **Check Network**: Verify Firestore connection is working
5. **Refresh**: Try refreshing the page after publishing rules

### Notifications Not Appearing

1. **Check Console**: Look for any error messages
2. **Verify Authentication**: Make sure you're logged in
3. **Check Firestore**: Go to Firebase Console → Firestore Database → Data
4. **Verify Collection**: Make sure the `notifications` collection exists
5. **Check Rules**: Verify security rules allow reading notifications

### Notifications Not Marking as Read

1. **Check Authentication**: Make sure you're logged in
2. **Check Console**: Look for any error messages
3. **Verify Rules**: Make sure security rules allow marking notifications as read
4. **Publish Rules**: Ensure you've published the latest `firestore.rules` from the project
5. **Refresh**: Try refreshing the page after publishing rules

## Security Considerations

### Current Implementation

The security model allows:
- Public reading of all posts (anyone can view the feed)
- Authenticated users can create posts
- Users can only modify their own content
- Admins have full control over all content

### Best Practices

1. **Content Moderation**: Consider adding admin tools to flag/remove inappropriate content
2. **Rate Limiting**: Implement rate limiting to prevent spam
3. **Validation**: Add client-side validation for post content length
4. **Image Uploads**: If adding image uploads, use Firebase Storage with proper security rules
5. **Reporting**: Add ability for users to report inappropriate posts

### Recommended Improvements for Production

1. **Server-Side Functions**: Use Firebase Cloud Functions for:
   - Content moderation
   - Spam detection
   - Notification triggers
   - Analytics tracking

2. **Advanced Security**: Add rules for:
   - Maximum post length
   - Rate limiting per user
   - Blocked users list
   - Content filtering

3. **Performance**: Implement:
   - Pagination for large feeds
   - Caching strategies
   - Lazy loading of comments
   - Image optimization

## Required Firestore Indexes

The live feed and notification system requires composite indexes for efficient querying.

### Creating Required Indexes

**Method 1: Automatic (Recommended)**

When you first use the notifications feature, Firestore will show an error with a direct link to create the required index:

1. Look for the error message in your browser console
2. Click the provided link (it will look like: `https://console.firebase.google.com/v1/r/project/YOUR_PROJECT/firestore/indexes?create_composite=...`)
3. The Firebase Console will open with the index pre-configured
4. Click **Create Index**
5. Wait for the index to build (usually takes a few minutes)

**Method 2: Manual**

If you prefer to create the index manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Configure the index:
   - **Collection ID**: `notifications`
   - **Fields to index**:
     - Field: `toUserId`, Order: `Ascending`
     - Field: `createdAt`, Order: `Descending`
   - **Query scope**: `Collection`
6. Click **Create**
7. Wait for the index to build (status will change from "Building" to "Enabled")

### Index Status

You can check the status of your indexes:

1. Go to **Firestore Database** → **Indexes** tab
2. Look for the `notifications` collection index
3. Status should show as **Enabled** (green)
4. If status shows **Building**, wait a few minutes and refresh

### Troubleshooting Index Errors

If you see an error like "The query requires an index":

1. **Check the Error Message**: It will contain a direct link to create the index
2. **Click the Link**: This is the fastest way to create the correct index
3. **Wait for Build**: Indexes can take 5-15 minutes to build for large collections
4. **Refresh Your App**: After the index is enabled, refresh your application
5. **Clear Cache**: If issues persist, clear your browser cache

## API Functions

The application provides these live feed functions:

### Create Post
\`\`\`typescript
await createPost(userId, userName, content, imageUrl?, userAvatar?)
\`\`\`

### Get Posts (Feed)
\`\`\`typescript
const posts = await getPosts(limit?, lastDoc?)
\`\`\`

### Like Post
\`\`\`typescript
await likePost(postId, userId)
\`\`\`

### Unlike Post
\`\`\`typescript
await unlikePost(postId, userId)
\`\`\`

### Add Comment
\`\`\`typescript
await addComment(postId, userId, userName, content, userAvatar?)
\`\`\`

### Get Comments
\`\`\`typescript
const comments = await getComments(postId)
\`\`\`

### Track View
\`\`\`typescript
await trackPostView(postId)
\`\`\`

### Delete Post
\`\`\`typescript
await deletePost(postId)
\`\`\`

### Add Notification
\`\`\`typescript
await addNotification(toUserId, fromUserId, fromUserName, type, message, postId?, commentId?, fromUserAvatar?)
\`\`\`

### Get Notifications
\`\`\`typescript
const notifications = await getNotifications(toUserId)
\`\`\`

### Mark Notification as Read
\`\`\`typescript
await markNotificationAsRead(notificationId)
\`\`\`

## Performance Optimization

### Best Practices

1. **Pagination**: Load posts in batches (default: 20 posts)
2. **Lazy Loading**: Load comments only when expanded
3. **Caching**: Use SWR or React Query for client-side caching
4. **Indexes**: Firestore automatically indexes `createdAt` for sorting
5. **Batch Operations**: Use batch writes when possible

### Monitoring

Track live feed usage:
1. Go to **Firestore Database** → **Usage** tab
2. Monitor read/write operations
3. Set up alerts for unusual activity
4. Review security rules logs for denied requests

## Support and Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Data Modeling Best Practices](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firebase Console](https://console.firebase.google.com/)

For issues specific to this application, check the browser console for error messages and verify your security rules are properly configured.
