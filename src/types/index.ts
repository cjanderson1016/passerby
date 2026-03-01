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
