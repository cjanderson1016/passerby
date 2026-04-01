/*
  File Name: AboutMeComponent.tsx

  Description: Export the datatypes and functions related to the about me component

  Author(s): Matthew Eagleman
*/

import { newBulletinComponent, type BulletinComponent } from "../BulletinComponent";

export type AboutMeComponentSpecificInfo = {
  component_id: string;
  created_at: string;
  text: string;
}

export type AboutMeComponentType = BulletinComponent & AboutMeComponentSpecificInfo

export function newAboutMeComponent(user_id: string, position: number): AboutMeComponentType {
  const bulletinComponentBase = newBulletinComponent()
  bulletinComponentBase.child_table = "about_me_components"
  bulletinComponentBase.name = "About Me"
  bulletinComponentBase.user_id = user_id
  bulletinComponentBase.position = position
  return {
    ...bulletinComponentBase,
    component_id: bulletinComponentBase.component_id,
    created_at: bulletinComponentBase.created_at,
    text: "Tell us about yourself!",
  }
}