/*
  File Name: TextComponent.tsx

  Description: Export the datatypes and functions related to the text component

  Author(s): Matthew Eagleman
*/

import { newBulletinComponent, type BulletinComponent } from "../BulletinComponent";

export type TextComponentSpecificInfo = {
  component_id: string;
  created_at: string;
  text: string;
}

export type TextComponentType = BulletinComponent & TextComponentSpecificInfo

export function newTextComponent(user_id: string, position: number): TextComponentType {
  const bulletinComponentBase = newBulletinComponent()
  bulletinComponentBase.child_table = "text_components"
  bulletinComponentBase.name = "New Text Component"
  bulletinComponentBase.user_id = user_id
  bulletinComponentBase.position = position
  return {
    ...bulletinComponentBase,
    component_id: bulletinComponentBase.component_id,
    created_at: bulletinComponentBase.created_at,
    text: "Enter text here...",
  }
}