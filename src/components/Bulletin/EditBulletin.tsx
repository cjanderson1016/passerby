/*
  File Name: EditBulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/

import "./Style/EditBulletin.css"
import { 
  type BulletinComponentsUnionType 
} from "./BulletinComponents";
import { supabase } from "../../lib/supabase";
import { useBulletin } from "../../hooks/useBulletin";
import { useState } from "react";
import Modal from "../Modal";
import NewComponentModal from "./NewComponentModal";
import { BiRename } from "react-icons/bi";
import { MdDeleteForever } from "react-icons/md";
import { IoIosAddCircleOutline, IoIosSave } from "react-icons/io";

interface EditBulletinProps {
  //Things to pass in to the bulletin editor
  components: Array<BulletinComponentsUnionType>
  profileUserId: string | null
  loadBulletin: (isActive: boolean) => Promise<void>
}

export default function EditBulletin({components: components}: EditBulletinProps) {
  //Render the edit bulletin menu

  const componentsCopy = [...components] //Creates a copy so vscode doesn't yell at me
  const [newComponentModalOpen, setNewComponentModalOpen] = useState(false) //Whether the new component modal is open or not
  const { // import all the required functions and such from the useBulletin hook
    cleanAdd, 
    updatedComponents, 
    bulletinComponents,
    editMode, 
    setBulletinComponents, 
    getTypeInfo, 
    addToDeletedComponents, 
    removeFromUpdatedComponents,
    deletedComponents,
    unsavedChanges,
    setUnsavedChanges
  } = useBulletin()

  interface SpecificComponentEditorProps {
    component: BulletinComponentsUnionType
  }

  function SpecificComponentEditor({component}: SpecificComponentEditorProps){
    // This component renders each component with some basic information, and the ability to move it up or down
    const [renaming, setRenaming] = useState(false)
    return(
      <div className="specific-component-editor">
        {renaming? (<input type="text" defaultValue={component.name} onKeyDown={async (e) => {
          if (e.key === "Enter") {
            cleanAdd({...component, name: e.currentTarget.value})
            setBulletinComponents(bulletinComponents.map(c => {
              if (c.component_id === component.component_id){
                return {...c, name: e.currentTarget.value}
              }
              else return c
            }))
            setRenaming(false)
          }
        }}/>) : (
        <div className="specific-component-editor-name-rename">
          <button className="specific-component-editor-button" onClick={() => { setRenaming(true) }}><BiRename/></button>
          <p>{component.name}</p>
        </div>
        )}
        <div className="specific-component-editor-delete-arrows">
          <button className="specific-component-editor-delete" onClick={() => deleteComponent(component)}><MdDeleteForever/></button>
          <div className="specific-component-editor-arrows">
            <button className="specific-component-editor-button" onClick={() => moveComponentUp(component)}>↑</button>
            <button className="specific-component-editor-button" onClick={() => moveComponentDown(component)}>↓</button>
          </div>
        </div>
      </div>
    )
  }

  const deleteComponent = async (component: BulletinComponentsUnionType) => {
    //Delete the given component from the bulletin, and update the position values of the remaining components to reflect the change
    console.log("Deleting component with id " + component.component_id)
    const newComponents = componentsCopy.filter(c => c.component_id !== component.component_id) //Create a new array without the deleted component
    setBulletinComponents(newComponents) //Render the new array
    addToDeletedComponents(component) //Add the deleted component to deletedComponents to be deleted from the database when the user clicks save
    removeFromUpdatedComponents(component) //Remove the deleted component from updatedComponents so it doesn't get accidentally re-added to the database when the user clicks save
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
  
  const pushNewStuffToDatabase = async () => {
    //Pusha all the changes in updated Components to the database.
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

  const deleteFromDatabase = async () => {
    const { error } = await supabase
      .from("bulletin_components")
      .delete()
      .in("component_id", deletedComponents.map(c => c.component_id))
    if (error){
      console.error("Failed to delete components from database")
    }
  }

  const saveBulletin = async () => {
    //Upload all the changed elements to the database
    console.log("Saving bulletin with the following component changes: ", updatedComponents)
    pushNewStuffToDatabase()
    deleteFromDatabase()
    setUnsavedChanges(false)
  }

  const displayNewComponentModal = () => {
    setNewComponentModalOpen(true)
  }

  return (
    <>
      {editMode && (
        //Render the editor full of tools and such for changing your bulletin
        <div className = "edit-bulletin">
          <div
          className="edit-bulletin-title"
          >
            <h2>
              Bulletin Editor
            </h2>
            {unsavedChanges && (
              <button 
                onClick={saveBulletin}
                className="edit-bulletin-save-button"
              > 
                <IoIosSave/> 
                save
              </button>
            )}
          </div>
          {unsavedChanges && (
            <div className="edit-bulletin-unsaved-text">
              <p>You have unsaved changes!</p>`
            </div>
          )}
          <p className="edit-bulletin-components-title">
            Bulletin Components
          </p>
          <button 
          onClick={displayNewComponentModal}
          className="add-new-component"
          >
            <div className="add-new-component-icon">
              <IoIosAddCircleOutline/>
            </div>
            <p>
              Create New Component
            </p>
          </button>
          {componentsCopy.map((component) => (
            <div key = {component.position}>
              <SpecificComponentEditor component = {component}/>
            </div>
          ))}
          <Modal
            is_open={newComponentModalOpen}
            current_state={setNewComponentModalOpen}
            component={<NewComponentModal 
              componentsCopy={componentsCopy}
              onClose={() => setNewComponentModalOpen(false)}
              />}
            title={"New Component"}
          />
        </div>
      )}
    </>
  );
}