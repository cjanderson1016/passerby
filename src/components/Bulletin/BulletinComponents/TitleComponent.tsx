/*
  File Name: TitleComponent.tsx

  Description: Component for title items on the bulletin board.

  Author(s): Matthew Eagleman
*/
import type { BulletinComponent } from "./BulletinComponent";
import "../Style/EditBulletin.css"
import { useBulletin } from "../../../hooks/useBulletin";

export type TitleComponentType = BulletinComponent & {
  title: string;
}

interface titleProps {
  component: TitleComponentType;
}

export function TitleComponent({
  component
}: titleProps) {

  const { editMode, isOwnProfile } = useBulletin()
  
  const onEdit = () => { 
    console.log("Edit Title clicked");
  }
  return (
      <div className="component">
          <h1>{component.title}</h1>
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