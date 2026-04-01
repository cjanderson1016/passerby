import { createContext } from "react"
import { type BulletinComponentsUnionType, type ComponentSpecificInfo } from "../components/Bulletin/BulletinComponents/BulletinComponent"

export interface BulletinContextType {
    editMode: boolean,
    setEditMode: (value: boolean) => void, 
    updatedComponents: Record<string, Array<BulletinComponentsUnionType>>
    cleanAdd: (component: BulletinComponentsUnionType) => void
    bulletinComponents: BulletinComponentsUnionType[]
    setBulletinComponents: React.Dispatch<React.SetStateAction<BulletinComponentsUnionType[]>>
    isOwnProfile: boolean
    setIsOwnProfile: React.Dispatch<React.SetStateAction<boolean>>
    getTypeInfo: (component: BulletinComponentsUnionType) => ComponentSpecificInfo
    addToDeletedComponents: (component: BulletinComponentsUnionType) => void
    deletedComponents: Array<BulletinComponentsUnionType>
    removeFromUpdatedComponents: (component: BulletinComponentsUnionType) => void
    unsavedChanges: boolean
    setUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>
}

export const bulletinContext = createContext<BulletinContextType | undefined>(undefined)