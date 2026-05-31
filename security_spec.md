# Security Spec

## Data Invariants
- User: `users/{userId}` can only be written by the user themselves.
- Notification: `notifications/{notificationId}` belongs to `userId` and can only be read/updated by that user.
- Project: `projects/{projectId}`. We don't have project members in the schema, but typically we want it to be readable by anyone, modifiable by anyone since there's no ownerId. Let's make it signed in users only for simplify.
- Page: `pages/{pageId}`. Readable by anyone, writable by signed in users.
- SiteSettings: `settings/global`. Readable by anyone, writable by signed in users.
- Task: `tasks/{taskId}`. Restricted to `ownerId`. 
- Note: `notes/{noteId}`. Restricted to `ownerId`.
- Post: `posts/{postId}`. Readable by signed in users, writable by signed in users (must match authorId).
- Channel: `channels/{channelId}`. Readable by members. Writable if creating and adding oneself as member, or updating if member.
- ChatMessage: `channels/{channelId}/messages/{messageId}`. Readable by channel members, writable by channel members (must match authorId).

## "Dirty Dozen" Payloads
1. User updating another user's email.
2. Notification access without correct userId.
3. Task with missing text.
4. Note with ownerId set to another user.
5. Post with no content.
6. Channel dm creation with no members.
7. ChatMessage creation in a channel user is not a member of.
8. Updating a Project status to an invalid enum string.
9. Writing a massive string to a Task text field (Resource Poisoning).
10. Shadow Update: Adding `isAdmin: true` to a User object.
11. Querying tasks without where clause to scrape data.
12. Creating a message with an authorId matching someone else's ID.
