/*
  File Name: TextComponent.tsx

  Description: Component for text items on the bulletin board.

  Author(s): Matthew Eagleman
*/

import type { BulletinComponent, BulletinComponentsUnionType } from "./BulletinComponent";
import "../EditBulletin.css"
import { useState } from "react";
import { useBulletin } from "../../../hooks/useBulletin";

export type TextComponentType = BulletinComponent & {
  text: string;
}

interface textProps {
  component: TextComponentType;
  isOwnProfile: boolean;
  loadBulletin: (isActive: boolean) => Promise<void>
  components: BulletinComponentsUnionType[];
  setBulletinComponents: React.Dispatch<React.SetStateAction<BulletinComponentsUnionType[]>>
}

export function TextComponent({
  component, 
  isOwnProfile,
  components,
  setBulletinComponents
}: textProps) {

  const [editComponent, setEditComponent] = useState(false)

  const {editMode, cleanAdd} = useBulletin()

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
                    setBulletinComponents(components.map(item => {
                      if (item.component_id === component.component_id){
                        return updatedComponent
                      }  
                      else return item
                    }))
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