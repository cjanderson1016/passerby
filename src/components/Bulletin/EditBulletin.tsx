/*
  File Name: EditBulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/

//import { useState } from "react";
import "./EditBulletin.css"
import { type BulletinComponentsUnionType } from "./BulletinComponents/BulletinComponent";
import { supabase } from "../../lib/supabase";

interface EditBulletinProps {
  show: boolean
  components: Array<BulletinComponentsUnionType>
  profileUserId: string | null
  loadBulletin: (isActive: boolean) => Promise<void>
}

export default function EditBulletin({show, components, profileUserId, loadBulletin}: EditBulletinProps) {
  
  interface SpecificComponentEditorProps {
    component: BulletinComponentsUnionType
  }

  function SpecificComponentEditor({component}: SpecificComponentEditorProps){
    return(
      <div className="specific-component-editor">
        <p>{component.child_table}</p>
        <button onClick={() => moveComponentUp(component)}>move up</button>
        <button onClick={() => moveComponentDown(component)}>move down</button>
      </div>
    )
  }

  const moveComponentUp = async (componentToMove: BulletinComponentsUnionType) => {
    if (componentToMove.position-1 < 0) {
      console.log("Component already at highest possible position")
      return 
    }
    let tempComponent = components[componentToMove.position-1]
    const { error: moveComponentError } = await supabase
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
    }
  }

  const moveComponentDown = async(componentToMove: BulletinComponentsUnionType) => {
    if (componentToMove.position+1 > components.length-1) {
      console.log("Component already at lowest possible position")
      return 
    }
    let tempComponent = components[componentToMove.position+1]
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
    }
  }
  
  return (
    <>
      {show && (
        <div className = "edit-bulletin">
          {components.map((component) => (
            <div key = {component.component_id}>
              <SpecificComponentEditor component = {component}/>
            </div>
          ))}
        </div>
      )}
    </>
  );
}