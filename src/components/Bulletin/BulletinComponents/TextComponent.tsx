/*
  File Name: TextComponent.tsx

  Description: Component for text items on the bulletin board.

  Author(s): Matthew Eagleman
*/

import type { BulletinComponent} from "./BulletinComponent";
import "../Style/EditBulletin.css"
import { useState } from "react";
import { useBulletin } from "../../../hooks/useBulletin";

export type TextComponentType = BulletinComponent & {
  text: string;
}

interface textProps {
  component: TextComponentType;
}

export function TextComponent({
  component
}: textProps) {

  const [editComponent, setEditComponent] = useState(false)

  const {editMode, cleanAdd, setBulletinComponents, isOwnProfile, bulletinComponents} = useBulletin()

  const onEdit = () => {
    setEditComponent(true)
  }

  return (
      <div className="component">
          {!editComponent? (
            <p>
              {component.text}
            </p>
          ): (
            <input
              type="text"
              className="edit-box"
              defaultValue={component.text}
              
              onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>)=>{
                if (e.key === "Enter") {
                  console.log("Save Text Component with text: " + e.currentTarget.value);
                  const updatedComponent = { ...component }
                  updatedComponent.text =  e.currentTarget.value
                  cleanAdd(updatedComponent)
                  setBulletinComponents(bulletinComponents.map(item => {
                    if (item.component_id === component.component_id){
                      return updatedComponent
                    }  
                    else return item
                  }))
                  setEditComponent(false)
                }
              }}
              
            />
          )}
          {isOwnProfile && editMode && (
        <button
          type="button"
          className="profile-inline-edit-btn"
          onClick={onEdit}
          aria-label="Edit Interests"
          title="Edit Interests"
        >
          ✏️
        </button>
      )}
      </div>
  );
}