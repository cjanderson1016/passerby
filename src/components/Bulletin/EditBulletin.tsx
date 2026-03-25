/*
  File Name: EditBulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/

import { useState } from "react";
import "./EditBulletin.css"
import { type BulletinComponentsUnionType } from "./BulletinComponents/BulletinComponent";
import { supabase } from "../../lib/supabase";

interface EditBulletinProps {
  //Things to pass in to the bulletin editor
  show: boolean
  components: Array<BulletinComponentsUnionType>
  profileUserId: string | null
  loadBulletin: (isActive: boolean) => Promise<void>
  setBulletinComponents: React.Dispatch<React.SetStateAction<BulletinComponentsUnionType[]>>
}

export default function EditBulletin({show, components, profileUserId, loadBulletin, setBulletinComponents}: EditBulletinProps) {
  //Render the edit bulletin menu

  interface SpecificComponentEditorProps {
    component: BulletinComponentsUnionType
  }

  function SpecificComponentEditor({component}: SpecificComponentEditorProps){
    // This component renders each component with some basic information, and the ability to move it up or down
    return(
      <div className="specific-component-editor">
        <p>{component.name}</p>
        <div>
          <button onClick={() => moveComponentUp(component)}>↑</button>
          <button onClick={() => moveComponentDown(component)}>↓</button>
        </div>
      </div>
    )
  }

  const moveComponentUp = async (component: BulletinComponentsUnionType) => {
    //Take the given component and move it one position up
    if (component.position-1 < 0) {
      console.log("Component already at highest possible position")
      return 
    }
    // Swap components in the array
    let tempComponent = components[component.position-1] //save component thats about to get overwritten
    components[component.position-1] = component //Moves the component up one position
    components[component.position] = tempComponent //Restors the overwritten component to the position below where it was origionally
    // Update the position values in the components to reflect their new positions
    components[component.position-1].position = component.position-1
    components[component.position].position = component.position
    // Render the new component order
    setBulletinComponents([...components])
    
    //Update the component in the database
    /*const { error: moveComponentError } = await supabase
      .from("bulletin_components")
      .upsert([
        {
          component_id: componentToMove.component_id, 
          position: componentToMove.position-1,
          child_table: componentToMove.child_table,
          user_id: profileUserId
        },{
          component_id: tempComponent.component_id, 
          position: componentToMove.position,
          child_table: tempComponent.child_table,
          user_id: profileUserId
        }
      ])
    if (moveComponentError){
      console.error("Failed moving component up")
    }
    else {
      await loadBulletin(true);
    }*/
  }

  const moveComponentDown = async(component: BulletinComponentsUnionType) => {
    //Take the given component and move it one position down
    if (component.position+1 > components.length-1) {
      console.log("Component already at lowest possible position")
      return 
    }
    // Swap components in the array
    let tempComponent = components[component.position+1] //save component thats about to get overwritten
    components[component.position+1] = component //Moves the component down one position
    components[component.position] = tempComponent //Restors the overwritten component to the position above where it was origionally
    // Update the position values in the components to reflect their new positions
    components[component.position+1].position = component.position+1
    components[component.position].position = component.position
    // Render the new component order
    setBulletinComponents([...components])
    /*
    let tempComponent = components[componentToMove.position+1]
    //Update the component in the database
    const { error: moveComponentError } = await supabase
      .from("bulletin_components")
      .upsert([
        {
          component_id: componentToMove.component_id, 
          position: componentToMove.position+1,
          child_table: componentToMove.child_table,
          user_id: profileUserId
        },{
          component_id: tempComponent.component_id, 
          position: componentToMove.position,
          child_table: tempComponent.child_table,
          user_id: profileUserId
        }
      ])
    if (moveComponentError){
      console.error("Failed moving component down")
    }
    else {
      await loadBulletin(true);
    }*/
  }
  
  return (
    <>
      {show && (
        //Render the editor full of tools and such for changing your bulletin
        <div className = "edit-bulletin">
          {components.map((component) => (
            <div key = {component.component_id}>
              <SpecificComponentEditor component = {component}/>
            </div>
          ))}
          <button>save</button>
        </div>
      )}
    </>
  );
}