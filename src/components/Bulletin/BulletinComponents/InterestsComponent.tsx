/*
  File Name: InterestsCard.tsx

  Description:
  Displays the user's interests on the profile page.
  Interests are shown as small tag-like elements.

  
*/

import "./Style/InterestsComponent.css";
import { type BulletinComponent } from "./BulletinComponent";
import "../EditBulletin.css"
import { useBulletin } from "../../../hooks/useBulletin";

export type InterestsComponentType = BulletinComponent & {
  component_id: string;
  position: number;
  interests: string; // array of interest strings
};

interface InterestsComponentProps {
  /*interests: string[];
  isOwnProfile: boolean;
  onEdit: () => void;*/
  component: InterestsComponentType
  isOwnProfile: boolean;
};

export function InterestsComponent({
  /*interests,
  isOwnProfile,
  onEdit,*/ 
  component,  
  isOwnProfile
}: InterestsComponentProps) {

  const {editMode} = useBulletin()

  const onEdit = () => {
    console.log("Edit Interests clicked");
  }

  return (
    <section className="profile-side-card">
      <div className="profile-side-card-header">
        <h3>Interests</h3>

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

      {component.interests.length > 0 ? (
        <div className="profile-interests-list">
          {component.interests.split(",").map((interest: string, index: number) => (
            <span key={index} className="profile-interest-tag">
              {interest}
            </span>
          ))}
        </div>
      ) : (
        <p className="profile-side-card-text">
          No interests added yet.
        </p>
      )}
    </section>
  );
}