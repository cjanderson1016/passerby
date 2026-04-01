/*
  File Name: TitleComponent.tsx

  Description: Export the datatypes and functions related to the title component

  Author(s): Matthew Eagleman
*/

import { newBulletinComponent, type BulletinComponent } from "../BulletinComponent";

export type TitleComponentSpecificInfo = {
  component_id: string;
  created_at: string;
  title: string;
}

export type TitleComponentType = BulletinComponent & TitleComponentSpecificInfo

export function newTitleComponent(user_id: string, position: number): TitleComponentType {
  const bulletinComponentBase = newBulletinComponent()
  bulletinComponentBase.child_table = "title_card_components"
  bulletinComponentBase.name = "Title"
  bulletinComponentBase.user_id = user_id
  bulletinComponentBase.position = position
  return {
    ...bulletinComponentBase,
    component_id: bulletinComponentBase.component_id,
    created_at: bulletinComponentBase.created_at,
    title: "New Title",
  }
}