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

interface BulletinProps {
  show: boolean; // whether to show this tab or not, passed from parent
}

export default function Bulletin(props: BulletinProps) {
  const { user, userProfile } = useUser();

  //const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bulletinComponents, setBulletinComponents] = useState<(TextComponentType | TitleComponentType)[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);

  const cleanAddComponents = (components: Array<TextComponentType | TitleComponentType>, additions: Array<TextComponentType | TitleComponentType>) => {
    additions.forEach((addition) => {
      let isInArray = false
      components.forEach((component) => {
        if (component.component_id === addition.component_id) isInArray = true;
      })
      if (!isInArray) components.push(addition)
    })
    return components.sort((a,b) => a.position - b.position)
  }

  useEffect(() => {
    if (user?.id) {
      //setCurrentUserId(user.id);
    }
  }, [user]);

  useEffect(() => {

    if (!userProfile?.id) return;
    const loadBulletin = async () => {
      setLoadingComponents(true);
      try {
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
        if (containerData){
          const componentTypes = new Set(containerData.map((component) => (component.child_table)));
          componentTypes.forEach(async (componentType) => {
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
              setBulletinComponents(prev => cleanAddComponents([...prev], [...componentTypeData]));
            }
          })
        }
      } finally {
        setLoadingComponents(false);
      }
    };
    loadBulletin()  
  }, [userProfile?.id]);
  
  return (
    <>
      {props.show && (
        <div className="Bulletin"> 
          {loadingComponents ? (
            <p>Loading Bulletin...</p>
          ) : bulletinComponents.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            bulletinComponents.map((component) => (
              <div key={component.component_id} className="bulletin-components">
                {component.child_table == "text_components" &&
                  <p key={component.component_id}>this is component {component.position}, it is of type {component.child_table}</p>
                }
                {component.child_table == "title_card_components" &&
                  <p key={component.component_id}>this is component {component.position}, it is of type {component.child_table}</p>
                }
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}