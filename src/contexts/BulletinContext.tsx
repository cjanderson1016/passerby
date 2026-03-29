import { useState, type ReactNode } from "react";
import { type BulletinComponentsUnionType } from "../components/Bulletin/BulletinComponents";
import { bulletinContext } from "./BulletinContextData";

const updatedComponents: Record<string, Array<BulletinComponentsUnionType>> = {}; //Keeps track of the components that need to be updated when save is pressed

export function BulletinProvider({children}: {children: ReactNode}) {
    //React Hooks
    const [editMode,setEditMode] = useState<boolean>(false)
    const [bulletinComponents, setBulletinComponents] = useState<BulletinComponentsUnionType[]>([]);
    
    const [isOwnProfile, setIsOwnProfile] = useState<boolean>(false)

    const cleanAdd = (component: BulletinComponentsUnionType) => {
        //Adds the given component to updatedComponents, without adding dupicates
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
      };

    return(
        <bulletinContext.Provider value = {{
            editMode,
            updatedComponents,
            setEditMode,
            cleanAdd,
            bulletinComponents,
            setBulletinComponents,
            isOwnProfile,
            setIsOwnProfile
        }}>{children}</bulletinContext.Provider>
    )
}