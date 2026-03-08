/*
  File Name: TextComponent.tsx

  Description: Component for text items on the bulletin board.

  Author(s): Matthew Eagleman
*/

import type { BulletinComponent } from "./BulletinComponent";
import "../EditBulletin.css"

export type TextComponentType = BulletinComponent & {
  text: string;
}

interface textProps {
  component: TextComponentType;
  isOwnProfile: boolean;
  editMode: boolean;
}

export default function TextComponent({
  component, 
  isOwnProfile, 
  editMode
}: textProps) {

  const onEdit = () => {
    console.log("Edit Text clicked");
  }

    return (
        <div className="component">
            {component.text}
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