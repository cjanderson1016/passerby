/*
  File Name: TextComponent.tsx

  Description: Component for text items on the bulletin board.

  Author(s): Matthew Eagleman
*/

import type { BulletinComponent, BulletinComponentsUnionType } from "./BulletinComponent";
import "../EditBulletin.css"
import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export type TextComponentType = BulletinComponent & {
  text: string;
}

interface textProps {
  component: TextComponentType;
  isOwnProfile: boolean;
  editMode: boolean;
  loadBulletin: (isActive: boolean) => Promise<void>
  components: BulletinComponentsUnionType[];
  setBulletinComponents: React.Dispatch<React.SetStateAction<BulletinComponentsUnionType[]>>
}

export function TextComponent({
  component, 
  isOwnProfile, 
  editMode,
  loadBulletin
}: textProps) {

  const [editComponent, setEditComponent] = useState(false)

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
                /*
                onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>)=>{
                  if (e.key === "Enter") {
                    console.log("Save Text Component with text: " + e.currentTarget.value);
                    await supabase
                      .from("text_components")
                      .update({text: e.currentTarget.value})
                      .eq("component_id", component.component_id)
                    setEditComponent(false)
                    await loadBulletin(true);
                  }
                }}
                */
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