/*
  File Name: InterestsComponent.tsx

  Description: Export the datatypes and functions related to the interests component

  Author(s): Matthew Eagleman
*/

import { newBulletinComponent, type BulletinComponent } from "../BulletinComponent";

export type InterestsComponentSpecificInfo = {
  component_id: string;
  created_at: string;
  interests: string;
}

export type InterestsComponentType = BulletinComponent & InterestsComponentSpecificInfo

export function newInterestsComponent(user_id: string, position: number): InterestsComponentType {
  const bulletinComponentBase = newBulletinComponent()
  bulletinComponentBase.child_table = "interests_components"
  bulletinComponentBase.name = "Interests"
  bulletinComponentBase.user_id = user_id
  bulletinComponentBase.position = position
  return {
    ...bulletinComponentBase,
    component_id: bulletinComponentBase.component_id,
    created_at: bulletinComponentBase.created_at,
    interests: "Enter your interests as a comma separated list."
  }
}