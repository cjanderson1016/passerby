import { createContext } from "react"
import { type BulletinComponentsUnionType } from "../components/Bulletin/BulletinComponents/BulletinComponent"

export interface BulletinContextType {
    editMode: boolean,
    setEditMode: (value: boolean) => void, 
    updatedComponents: Record<string, Array<BulletinComponentsUnionType>>
    cleanAdd: (component: BulletinComponentsUnionType) => void
}

export const bulletinContext = createContext<BulletinContextType | undefined>(undefined)