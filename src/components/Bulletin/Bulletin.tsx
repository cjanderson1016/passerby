/*
  File Name: Bulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import EditBulletin from "./EditBulletin.tsx";
import * as BulletinComponents from "./BulletinComponents";
// Style
import "./Bulletin.css";
import { useBulletin } from "../../hooks/useBulletin.ts";

interface BulletinProps {
  //Things to pass in to the bulletin component
  show: boolean; // whether to show this tab or not, passed from parent
  profileUserId: string | null; // the user ID of the profile we are viewing, used to fetch the correct bulletin components
  isOwnProfile: boolean;
}

export default function Bulletin({
  show,
  profileUserId,
  isOwnProfile,
}: BulletinProps) {
  //React hooks
  const [bulletinComponents, setBulletinComponents] = useState<BulletinComponents.BulletinComponentsUnionType[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);

  const {editMode, setEditMode} = useBulletin()

  const cleanAddComponents = useCallback(
    (
      components: Array<BulletinComponents.BulletinComponentsUnionType>,
      additions: Array<BulletinComponents.BulletinComponentsUnionType>,
    ) => {
      // Adds a list of components to an existing list of components, without adding duplicates
      additions.forEach((addition) => { //check each potential additional component, and see if it has already been loaded
        let isInArray = false;
        components.forEach((component) => {
          if (component.component_id === addition.component_id)
            isInArray = true;
        });
        if (!isInArray) components.push(addition);
      });
      return components.sort((a, b) => a.position - b.position);
    },
    [],
  );

  const loadBulletin = useCallback(
    async (isActive: boolean) => {
      // this function loads all bulletin components for the given profile user ID, then merges them into a single array sorted by position
      setLoadingComponents(true);
      //setBulletinComponents([]);

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
          //Pull the users components from supabase
          const byTypeData = await Promise.all(
            componentTypes.map(async (componentType) => {
              const { data: componentTypeData, error: componentTypeError } =
                await supabase
                  .from("bulletin_components")
                  .select(
                    `*,
                    ${componentType}!inner(*)`
                  )
                  .eq("user_id", profileUserId) // only load components for this user
                  .returns<BulletinComponents.BulletinComponentsUnionType[]>();
              if (componentTypeError) {
                console.error(
                  `error loading ${componentType}`,
                  componentTypeError,
                );
                return [] as BulletinComponents.BulletinComponentsUnionType[];
              }
              //console.log(`loaded ${componentType} data:`, componentTypeData);
              // Flatten the nested data from the join so that child table fields are at the top level
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const flattened = (componentTypeData ?? []).map((item: any) => ({
                ...item,
                ...item[componentType],
              }));
              return flattened as BulletinComponents.BulletinComponentsUnionType[];
            }),
          );

          if (!isActive) return; // check if component is still mounted before setting state

          let merged: BulletinComponents.BulletinComponentsUnionType[] = [];
          //Sort the components by position
          byTypeData.forEach((components) => {
            merged = cleanAddComponents([...merged], components);
          });
          setBulletinComponents(merged); // set the Bulletin components to the merged array
        }
      } finally {
        if (isActive) {
          setLoadingComponents(false);
        }
      }
    },
    [cleanAddComponents, profileUserId],
  ); // we include cleanAddComponents in the dependency array since it is defined outside of useEffect, but it is memoized with useCallback so it won't cause unnecessary re-renders

  useEffect(() => {
    // if we don't have a profile user ID, we can't load any bulletin components
    if (!profileUserId) {
      setBulletinComponents([]);
      return;
    }
    // we use a flag and check it in the async function to prevent setting state on an unmounted component
    let isActive = true;

    void loadBulletin(isActive); // we call the async function but don't await it since useEffect can't be async

    return () => {
      isActive = false; // when the component unmounts, set isActive to false to prevent setting state on an unmounted component
    };
  }, [loadBulletin, profileUserId]); // we include loadBulletin in the dependency array since it is defined outside of useEffect, but it is memoized with useCallback so it won't cause unnecessary re-renders

  return (
    <>
      {show && (
        <div className="bulletin">
          {/* bulletin content */}
          {loadingComponents ? (
            <p>Loading Bulletin...</p>
          ) : bulletinComponents.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            <></>
          )}
          {/*
          Render each component mapped to its respective component type
          There may be room to make this look a little prettier
          */}
          <div className="bulletin-content">
            {bulletinComponents.map((component) => (
              <div
                key={component.component_id}
                className="bulletin-components"
              >
                {component.child_table == "text_components" && (
                  <BulletinComponents.TextComponent
                    key={component.component_id}
                    component={component as BulletinComponents.TextComponentType}
                    isOwnProfile={isOwnProfile}
                    loadBulletin={loadBulletin}
                    components={bulletinComponents}
                    setBulletinComponents={setBulletinComponents}
                  />
                )}
                {component.child_table == "title_card_components" && (
                  <BulletinComponents.TitleComponent
                    key={component.component_id}
                    component={component as BulletinComponents.TitleComponentType}
                    isOwnProfile={isOwnProfile}
                  />
                )}
                {component.child_table == "about_me_components" && (
                  <BulletinComponents.AboutMeComponent
                    key={component.component_id}
                    component={component as BulletinComponents.AboutMeComponentType}
                    isOwnProfile={isOwnProfile}
                  />
                )}
                {component.child_table == "interests_components" && (
                  <BulletinComponents.InterestsComponent
                    key={component.component_id}
                    component={component as BulletinComponents.InterestsComponentType}
                    isOwnProfile={isOwnProfile}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Edit Menu */}
          <button onClick={() => setEditMode(!editMode)}>Edit Bulletin</button>
          {isOwnProfile && (
            <EditBulletin
              components={bulletinComponents}
              profileUserId={profileUserId}
              loadBulletin={loadBulletin}
              setBulletinComponents={setBulletinComponents}
            />
          )}
        </div>
      )}
    </>
  );
}
