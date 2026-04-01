/*
  File Name: BulletinComponent.tsx

  Description: Base component for bulletin board items.

  Author(s): Matthew Eagleman
*/
import type { TextComponentType, TextComponentSpecificInfo } from "./Data/TextComponentData";
import type { TitleComponentType, TitleComponentSpecificInfo } from "./Data/TitleComponentData";
import type { AboutMeComponentType, AboutMeComponentSpecificInfo } from "./Data/AboutMeComponentData";
import type { InterestsComponentType, InterestsComponentSpecificInfo } from "./Data/InterestsComponentData";

export type BulletinComponentsUnionType = TextComponentType | TitleComponentType | AboutMeComponentType | InterestsComponentType;

export type ComponentSpecificInfo = TextComponentSpecificInfo | TitleComponentSpecificInfo | AboutMeComponentSpecificInfo | InterestsComponentSpecificInfo;

export type BulletinComponent = {
  user_id: string;
  created_at: string;
  position: number;
  component_id: string;
  child_table: string;
  name: string
}

export function newBulletinComponent(): BulletinComponent {
  return {
    user_id: "user not yet specified",
    created_at: new Date().toISOString(),
    position: 0,
    component_id: crypto.randomUUID(),
    child_table: "child table not yet specified",
    name: "name not yet specified"
  }
}