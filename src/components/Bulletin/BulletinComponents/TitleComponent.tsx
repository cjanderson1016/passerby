/*
  File Name: TitleComponent.tsx

  Description: Component for title items on the bulletin board.

  Author(s): Matthew Eagleman
*/
import "../Style/EditBulletin.css"
import { useBulletin } from "../../../hooks/useBulletin";
import { useState } from "react";
import { type TitleComponentType } from "./Data/TitleComponentData";
import { MdOutlineEdit } from "react-icons/md";

interface titleProps {
  component: TitleComponentType;
}

export function TitleComponent({
  component
}: titleProps) {

  const [editComponent, setEditComponent] = useState(false)

  const { editMode, isOwnProfile, cleanAdd, setBulletinComponents, bulletinComponents } = useBulletin()
  
  const onEdit = () => { 
    setEditComponent(true)
  }
  return (
    <div className="component">
      {!editComponent? (
        <h1>{component.title}</h1>
      ) : (
        <input
          type="text"
          className="edit-box"
          defaultValue={component.title}
          
          onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>)=>{
            if (e.key === "Enter") {
              console.log("Save Title Component with title: " + e.currentTarget.value);
              const updatedComponent = { ...component }
              updatedComponent.title =  e.currentTarget.value
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
          className="specific-component-editor-button"
          onClick={onEdit}
          aria-label="Edit Interests"
          title="Edit Interests"
        >
          <MdOutlineEdit/>
        </button>
      )}
    </div>
  );
}