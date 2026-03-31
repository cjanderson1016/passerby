/*
  File Name: EditBulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/

import "./Style/EditBulletin.css"
import { newTitleComponent, type BulletinComponentsUnionType } from "./BulletinComponents";
import { supabase } from "../../lib/supabase";
import { useBulletin } from "../../hooks/useBulletin";
import { useState } from "react";
import { useUser } from "../../hooks/useUser";

interface EditBulletinProps {
  //Things to pass in to the bulletin editor
  components: Array<BulletinComponentsUnionType>
  profileUserId: string | null
  loadBulletin: (isActive: boolean) => Promise<void>
}

type FilterOption = 
  | "Title"
  | "Text"
  | "About Me"
  | "Interests";

export default function EditBulletin({components: components}: EditBulletinProps) {
  //Render the edit bulletin menu

  const componentsCopy = [...components] //Creates a copy so vscode doesn't yell at me
  const [filterOption, setFilterOption] = useState<FilterOption>("Text") //default option for the create new component dropdown menu

  const {cleanAdd, updatedComponents, editMode, setBulletinComponents, getTypeInfo} = useBulletin()
  const {user} = useUser()
  const user_id = user?.id

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
    const flatUpdate = Object.values(updatedComponents).flat() //Get just the lists of each component type, and flatten it into a single list of values
      const { error: moveComponentParentError } = await supabase
      .from("bulletin_components")
      .upsert(flatUpdate.map(component => ({
        user_id: component.user_id,
        created_at: component.created_at,
        position: component.position,
        component_id: component.component_id,
        child_table: component.child_table,
        name: component.name
      })))
    if (moveComponentParentError){
      console.error("Failed saving component changes for bulletin_components table, now updating table ")
    }
    Object.entries(updatedComponents).map(async ([table, typedComponents]) => {
      const { error: moveComponentChildError } = await supabase
        .from(table)
        .upsert(typedComponents.map(component => ({
          ...(getTypeInfo(component))
        })), { onConflict: "component_id" })
      if (moveComponentChildError){
        console.error("Failed saving component changes for table " + table)
      }
    })
  }

  const addComponent = () => {
    //Add a new component to the bottom of the bulletin.
    console.log("Adding new component of type " + filterOption)
    if (!user_id) {
      console.error("No user id found, cannot add component")
      return
    }
    const newComponent = newTitleComponent(user_id, componentsCopy.length)
    cleanAdd(newComponent)
    setBulletinComponents([...componentsCopy, newComponent])
    //console.log("New component created:", newComponent)
  }

  return (
    <>
      {editMode && (
        //Render the editor full of tools and such for changing your bulletin
        <div className = "edit-bulletin">
          {componentsCopy.map((component) => (
            <div key = {component.position}>
              <SpecificComponentEditor component = {component}/>
            </div>
          ))}
          <div className="new-component-menu">
            <button onClick={addComponent}>Create New Component</button>
            <select
              className="edit-select"
              onChange={(e) => {setFilterOption(e.target.value as FilterOption)}}
              value={filterOption}
            >
              <option value="Text">Text</option>
              <option value="Title">Title</option>
              <option value="About Me">About Me</option>
              <option value="Interests">Interests</option>
            </select>
          </div>
          <button onClick={saveBulletin}>save</button>
        </div>
      )}
    </>
  );
}