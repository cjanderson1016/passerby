/*
  File Name: AboutMeComponent.tsx

  Description:
  Card component for displaying the user's About Me section
  on the profile page.

  Author(s): Matthew Eagleman
*/

import "./Style/AboutMeComponent.css";
import "../Style/EditBulletin.css"
import { useBulletin } from "../../../hooks/useBulletin";
import { useState } from "react";
import { type AboutMeComponentType } from "./Data/AboutMeComponentData";
import { MdOutlineEdit } from "react-icons/md";

interface AboutMeCardProps {
  component: AboutMeComponentType
};

export function AboutMeComponent({
  component
}: AboutMeCardProps) {

  const [editComponent, setEditComponent] = useState(false)

  const {editMode, isOwnProfile, cleanAdd, setBulletinComponents, bulletinComponents} = useBulletin()

  const onEdit = () => {
    setEditComponent(true)
  }

  return (
    <section className="profile-side-card">
      <div className="profile-side-card-header">
        <h3>About Me</h3>
        
        {isOwnProfile && editMode && (
          <button
            type="button"
            className="specific-component-editor-button"
            onClick={onEdit}
            aria-label="Edit About Me"
            title="Edit About Me"
          >
            <MdOutlineEdit/>
          </button>
        )}
      </div>
      
      {!editComponent? (
        <p className="profile-side-card-text">
          {
            component.text
          /*aboutMe?.trim()
            ? aboutMe
            : "Tell people a little about yourself here."*/
          }
        </p>
      ) : (
        <input
          type="text"
          className="edit-box"
          defaultValue={component.text}
          
          onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>)=>{
            if (e.key === "Enter") {
              console.log("Save About Me Component with text: " + e.currentTarget.value);
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


    </section>
  );
}