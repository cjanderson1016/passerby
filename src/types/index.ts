// Common types shared across the application

export interface Friend {
  id: string;
  name: string;
  text: string;
  lastUpdatedMinutesAgo: number;
  unreadMessages: boolean;
};
