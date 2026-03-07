/*
  File Name: Bulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../hooks/useUser";
import type { TextComponentType } from "./BulletinComponents/TextComponent";
import type { TitleComponentType } from "./BulletinComponents/TitleComponent.tsx";
import EditBulletin from "./EditBulletin.tsx";
import "./Bulletin.css"

interface BulletinProps {
  show: boolean; // whether to show this tab or not, passed from parent
}

export default function Bulletin(props: BulletinProps) {
  const { user, userProfile } = useUser();

  //const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bulletinComponents, setBulletinComponents] = useState<(TextComponentType | TitleComponentType)[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);

  const [editMode, setEditMode] = useState(false);

  const cleanAddComponents = (components: Array<TextComponentType | TitleComponentType>, additions: Array<TextComponentType | TitleComponentType>) => {
    //check each potential additional component, and see if it has already been loaded
    additions.forEach((addition) => {
      let isInArray = false
      components.forEach((component) => {
        if (component.component_id === addition.component_id) isInArray = true;
      })
      if (!isInArray) components.push(addition)
    })
    return components.sort((a,b) => a.position - b.position)
  }

  const loadBulletin = async () => {
    //get all of the components sorted by
    setLoadingComponents(true);
    try {
      // pull all of the bulletin component containers from supabase
      if (!userProfile?.id) return
      const { data: containerData, error: containerError } = await supabase
        .from("bulletin_components")
        .select(`*`)
        .eq("user_id", userProfile.id)
        .order("position");
      if (containerError) {
        console.error("error loading bulletin components", containerError);
      } else {
        console.log("loaded bulletin components", containerData);
      }
      if (containerData){ //If the containers loaded successfully
        const componentTypes = new Set(containerData.map((component) => (component.child_table)));//get the unique component types we need to load based on the containers
        componentTypes.forEach(async (componentType) => {
          //theta join bulletin components with its respective child relationship to get the full components
          const {data: componentTypeData, error:componentTypeError} = await supabase
          .from("bulletin_components")
        .select(`
          *,
          ${componentType}!inner(*)
          `)
          .returns<((TextComponentType | TitleComponentType)[])>();
          if (componentTypeError) {
            console.error(`error loading ${componentType}`, componentTypeError);
          } else {
            console.log(`loaded ${componentType}`, componentTypeData);
            setBulletinComponents(prev => cleanAddComponents([...prev], [...componentTypeData])); //add component to bulletin components list
          }
        })
      }
      else console.log("userProfile not loaded yet")
    } finally {
      setLoadingComponents(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      //setCurrentUserId(user.id);
    }
  }, [user]);

  useEffect(() => {
    //useeffect to trigger whenever userid changes
    loadBulletin()  
  }, [userProfile?.id]); //monitors the user profile state variable
  
  return (
    <>
      {props.show && (
        <div className="bulletin"> 
          {/* bulletin content */}
          <button onClick={() => setEditMode(!editMode)}>Edit</button>
          {loadingComponents ? (
            <p>Loading Bulletin...</p>
          ) : bulletinComponents.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            <div className="bulletin-content">
              {bulletinComponents.map((component) => (
                <div key={component.component_id} className="bulletin-components">
                  {component.child_table == "text_components" &&
                    <p key={component.component_id}>this is component {component.position}, it is of type {component.child_table}</p>
                  }
                  {component.child_table == "title_card_components" &&
                    <p key={component.component_id}>this is component {component.position}, it is of type {component.child_table}</p>
                  }
                </div>
              ))}
            </div>
          )}
          {/* Edit Menu */}
          <EditBulletin show={editMode} />
        </div>
      )}
    </>
  )
}