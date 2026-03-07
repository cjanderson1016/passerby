/*
  File Name: Bulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { TextComponentType } from "./BulletinComponents/TextComponent";
import type { TitleComponentType } from "./BulletinComponents/TitleComponent.tsx";

interface BulletinProps {
  show: boolean; // whether to show this tab or not, passed from parent
  profileUserId: string | null; // the user ID of the profile we are viewing, used to fetch the correct bulletin components
}

export default function Bulletin({ show, profileUserId }: BulletinProps) {
  const [bulletinComponents, setBulletinComponents] = useState<
    (TextComponentType | TitleComponentType)[]
  >([]);
  const [loadingComponents, setLoadingComponents] = useState(false);

  const cleanAddComponents = (
    components: Array<TextComponentType | TitleComponentType>,
    additions: Array<TextComponentType | TitleComponentType>,
  ) => {
    additions.forEach((addition) => {
      let isInArray = false;
      components.forEach((component) => {
        if (component.component_id === addition.component_id) isInArray = true;
      });
      if (!isInArray) components.push(addition);
    });
    return components.sort((a, b) => a.position - b.position);
  };

  useEffect(() => {
    // if we don't have a profile user ID, we can't load any bulletin components
    if (!profileUserId) {
      setBulletinComponents([]);
      return;
    }
    // we use a flag and check it in the async function to prevent setting state on an unmounted component
    let isActive = true;

    // this function loads all bulletin components for the given profile user ID, then merges them into a single array sorted by position
    const loadBulletin = async () => {
      setLoadingComponents(true);
      setBulletinComponents([]);

      try {
        // first we load all the bulletin components for this user, which gives us the component IDs, types, and positions
        const { data: containerData, error: containerError } = await supabase
          .from("bulletin_components")
          .select(`*`)
          .eq("user_id", profileUserId)
          .order("position");
        // if there's an error loading the bulletin components, log it and return early
        if (containerError) {
          console.error("error loading bulletin components", containerError);
          return;
        }
        // if we have container data, we need to load the specific component data for each component based on its type, then merge it together
        if (containerData && containerData.length > 0) {
          const componentTypes = Array.from(
            new Set(containerData.map((component) => component.child_table)),
          );

          const byTypeData = await Promise.all(
            componentTypes.map(async (componentType) => {
              const { data: componentTypeData, error: componentTypeError } =
                await supabase
                  .from("bulletin_components")
                  .select(
                    `
              *,
              ${componentType}!inner(*)
            `,
                  )
                  .eq("user_id", profileUserId) // only load components for this user
                  .returns<(TextComponentType | TitleComponentType)[]>();

              if (componentTypeError) {
                console.error(
                  `error loading ${componentType}`,
                  componentTypeError,
                );
                return [] as (TextComponentType | TitleComponentType)[];
              }

              return componentTypeData ?? [];
            }),
          );

          if (!isActive) return; // check if component is still mounted before setting state

          let merged: (TextComponentType | TitleComponentType)[] = [];
          byTypeData.forEach((components) => {
            merged = cleanAddComponents([...merged], components);
          });
          setBulletinComponents(merged);
        }
      } finally {
        if (isActive) {
          setLoadingComponents(false);
        }
      }
    };

    void loadBulletin(); // we call the async function but don't await it since useEffect can't be async

    return () => {
      isActive = false; // when the component unmounts, set isActive to false to prevent setting state on an unmounted component
    };
  }, [profileUserId]);

  return (
    <>
      {show && (
        <div className="Bulletin">
          {loadingComponents ? (
            <p>Loading Bulletin...</p>
          ) : bulletinComponents.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            bulletinComponents.map((component) => (
              <div key={component.component_id} className="bulletin-components">
                {component.child_table == "text_components" && (
                  <p key={component.component_id}>
                    this is component {component.position}, it is of type{" "}
                    {component.child_table}
                  </p>
                )}
                {component.child_table == "title_card_components" && (
                  <p key={component.component_id}>
                    this is component {component.position}, it is of type{" "}
                    {component.child_table}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
