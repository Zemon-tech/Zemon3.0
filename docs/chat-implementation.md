# Real-time Chat Implementation with Supabase

This document outlines the implementation of the real-time chat functionality in the Team Management application using Supabase.

## Database Schema

The chat functionality relies on three main tables:

1. **channels** - Stores information about chat channels (groups, DMs, public channels)
   - `id` - UUID primary key
   - `name` - Channel name
   - `description` - Channel description
   - `type` - Channel type (direct, group, public)
   - `is_private` - Whether the channel is private
   - `created_by` - User who created the channel
   - `created_at` - Creation timestamp
   - `updated_at` - Last update timestamp

2. **channel_members** - Stores the relationship between users and channels they are members of
   - `id` - UUID primary key
   - `channel_id` - Reference to channels table
   - `user_id` - Reference to users table
   - `is_admin` - Whether the user is an admin of the channel
   - `joined_at` - When the user joined
   - `last_read_at` - Last time user read messages (for unread indicators)

3. **messages** - Stores individual chat messages
   - `id` - UUID primary key
   - `channel_id` - Reference to channels table
   - `user_id` - Reference to users table
   - `content` - Message content
   - `status` - Message status (sent, delivered, read)
   - `created_at` - Creation timestamp
   - `updated_at` - Last update timestamp

## Row Level Security Policies

Security policies ensure users can only access appropriate data:

- Users can view channels they are members of or public channels
- Users can create channels
- Channel admins can update and delete channels
- Users can view members of channels they belong to
- Users can join public channels
- Channel admins can add members
- Users can leave channels or be removed by admins
- Users can view and send messages in channels they belong to
- Users can edit or delete their own messages

## Real-time Subscriptions

The application uses Supabase's real-time capabilities to keep the chat interface updated:

1. **Channel Subscription**:
   ```javascript
   supabase
     .channel('public:channels')
     .on('postgres_changes', { 
       event: '*', 
       schema: 'public', 
       table: 'channel_members',
       filter: `user_id=eq.${user?.id}` 
     }, () => {
       fetchChannels();
     })
     .subscribe();
   ```

2. **Message Subscription**:
   ```javascript
   supabase
     .channel(`messages:${activeChannel.id}`)
     .on('postgres_changes', { 
       event: 'INSERT', 
       schema: 'public', 
       table: 'messages',
       filter: `channel_id=eq.${activeChannel.id}` 
     }, payload => {
       setMessages(current => [...current, payload.new]);
     })
     .subscribe();
   ```

## Component Architecture

The chat implementation follows this structure:

1. **useChat Hook** (`/src/hooks/useChat.js`): Encapsulates all chat-related logic and state
   - Manages channels and direct messages
   - Handles real-time subscriptions
   - Provides message sending functionality
   - Manages active channel state

2. **ChatPage** (`/src/app/(app)/chat/page.jsx`): Primary UI component
   - Renders channel list and messages
   - Uses the useChat hook for functionality
   - Handles UI interactions

3. **CreateChannel/CreateDirectMessage** Components:
   - Modal dialogs for creating new conversations
   - Integrate with the useChat hook

## Direct Messages

Direct messages are implemented as special channels with:
- Type set to 'direct'
- Name formatted as `${userId1}:${userId2}` (sorted to ensure consistency)
- Private flag set to true

The UI displays the other user's name instead of the channel name for direct messages.

## User Authentication Integration

The chat functionality integrates with the existing authentication system:
- Uses the useAuth hook to get the current user
- Secures all chat operations with Supabase RLS
- Updates user profile display in AppLayout.jsx

## Message Formatting

Messages display:
- User name and avatar
- Timestamp in readable format
- Message content
- Visual differentiation for the current user's messages (right-aligned)

## Next Steps for Enhancement

Potential future improvements:
1. Message read receipts
2. Typing indicators
3. Message reactions and emoji support
4. File/image sharing
5. Message threading
6. Search functionality
7. Notification system for new messages 