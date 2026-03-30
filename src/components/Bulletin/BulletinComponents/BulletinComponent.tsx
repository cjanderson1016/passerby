/*
  File Name: BulletinComponent.tsx

  Description: Base component for bulletin board items.

  Author(s): Matthew Eagleman
*/
import { type TextComponentType } from "./TextComponent";
import { type TitleComponentType } from "./TitleComponent";
import { type AboutMeComponentType } from "./AboutMeComponent";
import { type InterestsComponentType } from "./InterestsComponent";

export type BulletinComponentsUnionType = TextComponentType | TitleComponentType | AboutMeComponentType | InterestsComponentType;

export type BulletinComponent = {
  user_id: string;
  created_at: string;
  position: number;
  component_id: string;
  child_table: string;
  name: string
}