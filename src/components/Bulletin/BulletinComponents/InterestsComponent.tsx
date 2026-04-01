/*
  File Name: InterestsCard.tsx

  Description:
  Displays the user's interests on the profile page.
  Interests are shown as small tag-like elements.

  Author(s): Matthew Eagleman
*/

import "./Style/InterestsComponent.css";
import "../Style/EditBulletin.css"
import { useBulletin } from "../../../hooks/useBulletin";
import { useState } from "react";
import { type InterestsComponentType } from "./Data/InterestsComponentData";

interface InterestsComponentProps {
  component: InterestsComponentType
};

export function InterestsComponent({
  component
}: InterestsComponentProps) {

  const [editComponent, setEditComponent] = useState(false)

  const {editMode, isOwnProfile, bulletinComponents, cleanAdd, setBulletinComponents} = useBulletin()

  const onEdit = () => {
    setEditComponent(true)
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

      {!editComponent? (
        <>
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
        </>
      ) : (
        <input
          type="text"
          className="edit-box"
          defaultValue={component.interests}
          
          onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>)=>{
            if (e.key === "Enter") {
              console.log("Save About Me Component with text: " + e.currentTarget.value);
              const updatedComponent = { ...component }
              updatedComponent.interests =  e.currentTarget.value
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


    </section>
  );
}