/*
  File Name: BulletinComponent.tsx

  Description: Base component for bulletin board items.

  Author(s): Matthew Eagleman
*/
import { type TextComponentType } from "./TextComponent";
import { type TitleComponentType } from "./TitleComponent";

export type BulletinComponentsUnionType = TextComponentType | TitleComponentType

export type BulletinComponent = {
  component_id: string;
  position: number;
  created_at: string;
  child_table: string;
}