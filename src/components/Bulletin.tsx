/*
  File Name: Bulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";

type BulletinComponent = {
  component_id: string;
  position: number;
  created_at: string;
  child_table: string;
}

type TextComponent = BulletinComponent & {
  text: string;
}

type TitleComponent = BulletinComponent & {
  title: string;
}

interface BulletinProps {
  show: boolean; // whether to show this tab or not, passed from parent
}

export default function Bulletin(props: BulletinProps) {
  const { user, userProfile } = useUser();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [bulletinComponents, setBulletinComponents] = useState<(TextComponent | TitleComponent)[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
    }
  }, [user]);

  useEffect(() => {
      if (!userProfile?.id) return;
      const loadBulletin = async () => {
        setLoadingComponents(true);
        try {
          setBulletinComponents([])
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
            console.log("component types:",componentTypes);
            componentTypes.forEach(async (componentType) => {
              const {data: componentTypeData, error:componentTypeError} = await supabase
              .from("bulletin_components")
              .select(`
                *,
                ${componentType}!inner(*)
              `)
              .returns<((TextComponent | TitleComponent)[])>();
              if (componentTypeError) {
                console.error(`error loading ${componentType}`, componentTypeError);
              } else {
                console.log(`loaded ${componentType}`, componentTypeData);
                setBulletinComponents(prev => [...prev, ...componentTypeData]);
              }
            })
            //setBulletinComponents(prev => prev.sort((a,b) => a.position - b.position))
          }
        } finally {
          setLoadingComponents(false);
        }
      };
  
      loadBulletin();
    }, [userProfile?.id]);
  return (
    <>
      {props.show && (
        <div> 
          {
          bulletinComponents.map((component) => (
            <div key={component.component_id} className="bulliton-components">
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
    </>
  )
}