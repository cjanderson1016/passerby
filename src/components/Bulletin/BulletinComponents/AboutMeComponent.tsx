/*
  File Name: AboutMeComponent.tsx

  Description:
  Card component for displaying the user's About Me section
  on the profile page.

  Author(s): Matthew Eagleman
*/

import "./Style/AboutMeComponent.css";
import { type BulletinComponent } from "./BulletinComponent";
import "../EditBulletin.css"
import { useBulletin } from "../../../hooks/useBulletin";

export type AboutMeComponentType = BulletinComponent & {
  component_id: string;
  user_id: string;
  text: string;
};

interface AboutMeCardProps {
  /*aboutMe?: string | null;
  isOwnProfile: boolean;
  onEdit: () => void;*/
  component: AboutMeComponentType
  isOwnProfile: boolean
};

export function AboutMeComponent({
  //aboutMe,
  //onEdit,
  component,
  isOwnProfile
}: AboutMeCardProps) {

  const {editMode} = useBulletin()

  const onEdit = () => {
    console.log("Edit About Me clicked");
  }

  return (
    <section className="profile-side-card">
      <div className="profile-side-card-header">
        <h3>About Me</h3>
        
        {isOwnProfile && editMode && (
          <button
            type="button"
            className="profile-inline-edit-btn"
            onClick={onEdit}
            aria-label="Edit About Me"
            title="Edit About Me"
          >
            ✏️
          </button>
        )}
      </div>

      <p className="profile-side-card-text">
        {
          component.text
        /*aboutMe?.trim()
          ? aboutMe
          : "Tell people a little about yourself here."*/
        }
      </p>
    </section>
  );
}