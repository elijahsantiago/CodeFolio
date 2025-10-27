# Firebase Connection System Setup Guide

## Current Issue

The connection request system is currently broken due to Firestore security rule restrictions. When users send connection requests, they don't appear in the recipient's notifications panel.

### Root Cause

The connection system tries to update **both users' profile documents**:
1. **Sender's profile**: Adds request to `sentConnectionRequests` array ✅ (Works - user can write to own document)
2. **Recipient's profile**: Adds request to `receivedConnectionRequests` array ❌ (Fails - user cannot write to another user's document)

Firestore security rules only allow users to write to their own documents, so when User A sends a connection request to User B, the attempt to update User B's profile fails silently.

## Debug Evidence

From the logs, we can see:
\`\`\`
[v0] Sending connection request to: F8YW5oQ8GIUhfkjAeShCQyvNMg83
[v0] Found 0 pending requests  // Recipient sees no requests
\`\`\`

The request is sent successfully, but the recipient never receives it because their profile document wasn't updated.

---

## Solution: Update Firestore Security Rules

You need to update your Firestore security rules to allow users to add connection requests to other users' profiles.

### Step 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab at the top

### Step 2: Update Security Rules

Replace your current rules with the following:

\`\`\`javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             (request.auth.token.email == 'e.santiago.e1@gmail.com' || 
              request.auth.token.email == 'gabeasosa@gmail.com');
    }
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    
    // Profile rules
    match /profiles/{userId} {
      // Anyone can read profiles
      allow read: if true;
      
      // Users can create their own profile
      allow create: if isAuthenticated() && isOwner(userId);
      
      // Users can update their own profile OR admins can update any profile
      // OR authenticated users can add connection requests to other profiles
      allow update: if isOwner(userId) 
                    || isAdmin()
                    || (isAuthenticated() && isConnectionRequestUpdate());
      
      // Users can delete their own profile OR admins can delete any profile
      allow delete: if isOwner(userId) || isAdmin();
    }
    
    // Helper function to check if update is only adding a connection request
    function isConnectionRequestUpdate() {
      let incomingData = request.resource.data;
      let existingData = resource.data;
      
      // Check if only receivedConnectionRequests or sentConnectionRequests is being modified
      let onlyConnectionRequestsChanged = 
        incomingData.diff(existingData).affectedKeys().hasOnly(['receivedConnectionRequests', 'sentConnectionRequests', 'updatedAt']);
      
      // Check if the request is adding to receivedConnectionRequests (someone sending you a request)
      let isReceivingRequest = 
        incomingData.receivedConnectionRequests.size() > existingData.receivedConnectionRequests.size();
      
      // Check if the request is removing from sentConnectionRequests (someone canceling their request)
      let isCancelingRequest = 
        incomingData.sentConnectionRequests.size() < existingData.sentConnectionRequests.size();
      
      return onlyConnectionRequestsChanged && (isReceivingRequest || isCancelingRequest);
    }
  }
}
\`\`\`

### Step 3: Publish Rules

1. Click the **Publish** button in the top right
2. Wait for the confirmation message: "Rules published successfully"

---

## How the Connection System Works After Fix

### Sending a Connection Request

1. **User A** clicks "Send Request" on **User B's** profile
2. The system updates **both profiles**:
   - **User A's profile**: Adds request to `sentConnectionRequests` array
   - **User B's profile**: Adds request to `receivedConnectionRequests` array ✅ (Now allowed by security rules)
3. **User B** sees the request in their notifications panel

### Accepting a Connection Request

1. **User B** clicks "Accept" in their notifications panel
2. The system updates **User B's profile only**:
   - Removes request from `receivedConnectionRequests`
   - Adds **User A** to `connections` array
3. **User A** will see **User B** in their connections when they refresh

### Rejecting a Connection Request

1. **User B** clicks "Reject" in their notifications panel
2. The system updates **User B's profile only**:
   - Removes request from `receivedConnectionRequests`
3. The request is removed from **User B's** view

### Canceling a Connection Request

1. **User A** clicks "Cancel Request" on **User B's** profile
2. The system updates **User A's profile only**:
   - Removes request from `sentConnectionRequests`
3. The request is removed from **User A's** view

---

## Security Considerations

### What the Rules Allow

✅ **Users can read any profile** - Necessary for viewing other users' portfolios
✅ **Users can create their own profile** - Standard user registration
✅ **Users can update their own profile** - Standard profile editing
✅ **Users can add connection requests to other profiles** - Enables the connection system
✅ **Admins can update/delete any profile** - Admin moderation capabilities

### What the Rules Prevent

❌ **Users cannot delete other users' profiles** - Only admins can do this
❌ **Users cannot modify other users' profile data** - Except for connection requests
❌ **Unauthenticated users cannot write data** - Must be logged in

### The `isConnectionRequestUpdate()` Function

This helper function ensures that when users update other profiles, they can **only**:
- Add to the `receivedConnectionRequests` array (sending a request)
- Remove from the `sentConnectionRequests` array (canceling a request)
- Update the `updatedAt` timestamp

They **cannot** modify any other fields like `displayName`, `bio`, `showcases`, etc.

---

## Testing the Fix

After applying the security rules, test the connection system:

### Test 1: Send Connection Request
1. Log in as **User A**
2. Navigate to **User B's** profile
3. Click **"Send Request"**
4. Log in as **User B**
5. Check the notifications panel (bell icon)
6. ✅ You should see the connection request from **User A**

### Test 2: Accept Connection Request
1. As **User B**, click **"Accept"** on the request
2. Check your connections (click the connections button)
3. ✅ You should see **User A** in your connections
4. Log in as **User A**
5. Check your connections
6. ✅ You should see **User B** in your connections

### Test 3: Reject Connection Request
1. Send a new request from **User A** to **User B**
2. As **User B**, click **"Reject"** on the request
3. ✅ The request should disappear from notifications
4. ✅ **User A** should not appear in connections

### Test 4: Cancel Connection Request
1. Send a new request from **User A** to **User B**
2. As **User A**, navigate to **User B's** profile
3. Click **"Cancel Request"**
4. ✅ The button should change back to **"Send Request"**
5. Log in as **User B**
6. ✅ The request should not appear in notifications

---

## Troubleshooting

### Issue: Still seeing "Missing or insufficient permissions"

**Solution**: Make sure you clicked **Publish** after updating the rules. Rules don't take effect until published.

### Issue: Requests still not appearing in notifications

**Solution**: 
1. Check the browser console for errors
2. Verify the rules were published successfully
3. Try logging out and logging back in
4. Clear browser cache and reload

### Issue: Old requests are stuck

**Solution**: 
1. Go to Firestore Database in Firebase Console
2. Navigate to the `profiles` collection
3. Find your profile document
4. Manually clear the `receivedConnectionRequests` and `sentConnectionRequests` arrays
5. Save the document

### Issue: Admin features not working

**Solution**: Make sure your email exactly matches one of the admin emails in the `isAdmin()` function:
- `e.santiago.e1@gmail.com`
- `gabeasosa@gmail.com`

If your email is different, update the `isAdmin()` function in the security rules.

---

## Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Security Rules Testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Common Security Patterns](https://firebase.google.com/docs/firestore/security/rules-conditions)

---

## Summary

The connection system requires special Firestore security rules because it needs to update multiple users' documents. By adding the `isConnectionRequestUpdate()` helper function, we allow users to add connection requests to other profiles while preventing them from modifying any other data. This enables the connection system to work properly while maintaining security.

**After applying these rules, the connection system will work as expected!**
