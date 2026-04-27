/*
  File Name: EditBulliton.tsx

  Description: This component overlays a modal with options to add a new component

  Author(s): Matthew Eagleman
*/

import { useBulletin } from "../../hooks/useBulletin"
import "./Style/EditBulletin.css"
import "./Style/NewComponentModal.css"
import { 
    type BulletinComponentsUnionType,
    newTitleComponent,
    newTextComponent,
    newAboutMeComponent,
    newInterestsComponent 
} from "./BulletinComponents"
import { useUser } from "../../hooks/useUser"
import { useState } from "react"

interface NewComponentProps {
    componentsCopy: BulletinComponentsUnionType[]
    onClose: () => void
}

type FilterOption = 
  // options for the dropdown menu
  | "Title"
  | "Text"
  | "About Me"
  | "Interests";

export default function NewComponentModal({
        componentsCopy,
        onClose
    }: NewComponentProps) {

    const {user} = useUser()
    const user_id = user?.id
    const [filterOption, setFilterOption] = useState<FilterOption>("Text") //default option for the create new component dropdown menu
    const {
        cleanAdd,
        setBulletinComponents
    } = useBulletin()

    const addComponent = () => {
        //Add a new component to the bottom of the bulletin.
        console.log("Adding new component of type " + filterOption)
        if (!user_id) {
          console.error("No user id found, cannot add component")
          return
        }
        let newComponent: BulletinComponentsUnionType
        switch(filterOption){
          case "Title":
            newComponent = newTitleComponent(user_id, componentsCopy.length)
            break
          case "Text":
            newComponent = newTextComponent(user_id, componentsCopy.length)
            break
          case "About Me":
            newComponent = newAboutMeComponent(user_id, componentsCopy.length)
            break
          case "Interests":
            newComponent = newInterestsComponent(user_id, componentsCopy.length)
            break
        }
        cleanAdd(newComponent)
        setBulletinComponents([...componentsCopy, newComponent])
        handleClose()
        //console.log("New component created:", newComponent)
    }

    const handleClose = () => {
        onClose();
    };

    return (
        <div className="new-component-overlay">
            <div className="new-component-modal">
                <div className="new-component-type">
                    <h2>Component Type</h2>
                    <select
                        className="edit-select"
                        onChange={(e) => {setFilterOption(e.target.value as FilterOption)}}
                        value={filterOption}
                    >
                        <option value="Title">Title</option>
                        <option value="Text">Text</option>
                        <option value="About Me">About Me</option>
                        <option value="Interests">Interests</option>
                    </select>
                </div>
                <button onClick={addComponent}>Add Component</button>
            </div>
            
        </div>
    )
}