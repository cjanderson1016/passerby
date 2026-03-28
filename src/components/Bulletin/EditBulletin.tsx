/*
  File Name: EditBulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/

import "./EditBulletin.css"
import { type BulletinComponentsUnionType } from "./BulletinComponents";
import { supabase } from "../../lib/supabase";
import { useBulletin } from "../../hooks/useBulletin";

interface EditBulletinProps {
  //Things to pass in to the bulletin editor
  components: Array<BulletinComponentsUnionType>
  profileUserId: string | null
  loadBulletin: (isActive: boolean) => Promise<void>
  setBulletinComponents: React.Dispatch<React.SetStateAction<BulletinComponentsUnionType[]>>
}

export default function EditBulletin({components: components, setBulletinComponents}: EditBulletinProps) {
  //Render the edit bulletin menu

  const componentsCopy = [...components] //Creates a copy so vscode doesn't yell at me

  const {cleanAdd, updatedComponents, editMode} = useBulletin()

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
    const pos = component.position
    const targetPos = pos-1
    // Swap components in the array
    const tempComponent = componentsCopy[targetPos] //save component thats about to get overwritten
    componentsCopy[targetPos] = component //Moves the component up one position
    componentsCopy[pos] = tempComponent //Restors the overwritten component to the position below where it was origionally
    // Update the position values in the components to reflect their new positions
    componentsCopy[targetPos].position = targetPos
    componentsCopy[pos].position = pos
    // Add the updated components to updatedComponents to be saved when the user clicks save
    cleanAdd(componentsCopy[targetPos])
    cleanAdd(componentsCopy[pos])
    // Render the new component order
    setBulletinComponents([...componentsCopy])
  }

  const moveComponentDown = async(component: BulletinComponentsUnionType) => {
    //Take the given component and move it one position down
    if (component.position+1 > componentsCopy.length-1) {
      console.log("Component already at lowest possible position")
      return 
    }
    const pos = component.position
    const targetPos = pos+1
    // Swap components in the array
    const tempComponent = componentsCopy[targetPos] //save component thats about to get overwritten
    componentsCopy[targetPos] = component //Moves the component down one position
    componentsCopy[pos] = tempComponent //Restors the overwritten component to the position above where it was origionally
    // Update the position values in the components to reflect their new positions
    componentsCopy[targetPos].position = targetPos
    componentsCopy[pos].position = pos
    // Add the updated components to updatedComponents to be saved when the user clicks save
    cleanAdd(componentsCopy[targetPos])
    cleanAdd(componentsCopy[pos])
    // Render the new component order
    setBulletinComponents([...componentsCopy])
  }
  
  const saveBulletin = async () => {
    //Upload all the changed elements to the database
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
        console.error("Failed saving component changes for bulletin_components table, now updating table " + table)
      }
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
      {editMode && (
        //Render the editor full of tools and such for changing your bulletin
        <div className = "edit-bulletin">
          {componentsCopy.map((component) => (
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