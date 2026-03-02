/*
  File Name: index.ts

  Description: This file defines common types that are shared across multiple components in the application.
  By centralizing these types, we can ensure consistency and reduce duplication across our codebase.

  Author(s): Connor Anderson
*/

// Common types shared across the application

export interface Friend {
  id: string;
  name: string;
  text: string;
  lastUpdatedMinutesAgo: number;
  unreadMessages: boolean;
};

// Minimal representation of a post record returned by Supabase. We only
// care about timestamps for the dashboard feed, but exporting the full
// shape makes it easier to extend later.
export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string | null;
  updated_at: string | null;
}

// Row from the `friend_requests` table once accepted.
export interface AcceptedFriendRequest {
  requester_id: string;
  recipient_id: string;
}

// Basic user info returned when querying `users` for friends.
export interface FriendUser {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
}

// A conversation joined with the other participant's info and last message preview.
export interface ConversationPreview {
  conversation_id: string;
  last_message_at: string | null;
  other_user: FriendUser;
  last_message_content: string | null;
}

// A single message in a conversation thread.
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
