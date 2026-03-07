/*
  File Name: BulletinComponent.tsx

  Description: Base component for bulletin board items.

  Author(s): Matthew Eagleman
*/

export type BulletinComponent = {
  component_id: string;
  position: number;
  created_at: string;
  child_table: string;
}