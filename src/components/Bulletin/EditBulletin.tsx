/*
  File Name: EditBulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/

//import { Children, useState } from "react";
import "./EditBulletin.css"
import { type BulletinComponentsUnionType } from "./BulletinComponents";
import { supabase } from "../../lib/supabase";

const updatedComponents: Record<string, Array<BulletinComponentsUnionType>> = {}; //Keeps track of the components that need to be updated when save is pressed
console.log("reset updatedComponents to empty object: ", updatedComponents)

interface EditBulletinProps {
  //Things to pass in to the bulletin editor
  show: boolean
  components: Array<BulletinComponentsUnionType>
  profileUserId: string | null
  loadBulletin: (isActive: boolean) => Promise<void>
  setBulletinComponents: React.Dispatch<React.SetStateAction<BulletinComponentsUnionType[]>>
}

export default function EditBulletin({show, components, setBulletinComponents}: EditBulletinProps) {
  //Render the edit bulletin menu
  //console.log("Rendering EditBulletin with components: ", components)

  interface SpecificComponentEditorProps {
    component: BulletinComponentsUnionType
  }

  const cleanAdd = (component: BulletinComponentsUnionType) => {
    //Adds the given component to updatedComponents, without adding dupicates
    console.log("Adding component to updatedComponents: ", component)
    if (!updatedComponents[component.child_table]) {
      updatedComponents[component.child_table] = [];
    }
    updatedComponents[component.child_table].forEach(item => {
      if (item.component_id === component.component_id) {
        //remove the old version of the component from updatedComponents
        updatedComponents[component.child_table] = updatedComponents[component.child_table].filter(c => c.component_id !== component.component_id) 
      }
    });
    updatedComponents[component.child_table].push(component)
    console.log("updatedComponents is now: ", updatedComponents)
  };

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
    let pos = component.position
    let targetPos = pos-1
    console.log(`Moving component ${component.component_id} from position ${pos} to position ${targetPos}`) 
    // Swap components in the array
    let tempComponent = components[targetPos] //save component thats about to get overwritten
    components[targetPos] = component //Moves the component up one position
    components[pos] = tempComponent //Restors the overwritten component to the position below where it was origionally
    // Update the position values in the components to reflect their new positions
    components[targetPos].position = targetPos
    components[pos].position = pos
    // Add the updated components to updatedComponents to be saved when the user clicks save
    cleanAdd(components[targetPos])
    cleanAdd(components[pos])
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
    let pos = component.position
    let targetPos = pos+1
    // Swap components in the array
    let tempComponent = components[targetPos] //save component thats about to get overwritten
    components[targetPos] = component //Moves the component down one position
    components[pos] = tempComponent //Restors the overwritten component to the position above where it was origionally
    // Update the position values in the components to reflect their new positions
    components[targetPos].position = targetPos
    components[pos].position = pos
    // Add the updated components to updatedComponents to be saved when the user clicks save
    cleanAdd(components[targetPos])
    cleanAdd(components[pos])
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
  
  const saveBulletin = async () => {
    console.log("Saving bulletin with the following component changes: ", updatedComponents)
    Object.entries(updatedComponents).map(async ([table, components]) => {
      const { error: moveComponentParentError } = await supabase
        .from("bulletin_components")
        .upsert(components.map(component => ({
          user_id: component.user_id,
          created_at: component.created_at,
          position: component.position,
          component_id: component.component_id,
          child_table: component.child_table,
          name: component.name
        })))
      if (moveComponentParentError){
        console.error("Failed saving component changes for bulletin_components table")
      }
      console.log(`Saved component changes for bulletin_components table, now saving changes for child table ${table}`) 
      /*const { error: moveComponentChildError } = await supabase
        .from(table)
        .upsert(components.map(compoonent => ({

        })), { onConflict: "component_id" })
      if (moveComponentChildError){
        console.error("Failed saving component changes for table " + table)
      }*/
    })
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
          <button onClick={saveBulletin}>save</button>
        </div>
      )}
    </>
  );
}