/*
  File Name: Accordion.tsx

  Description: Outlines an "accordion" feature which is a menu that displays vertically stacked headers that reveal more content 
    when clicked on. Headers may be collapsed and expanded at will by clicking on the header.

  Author(s): Owen Berkholtz
*/
import React, { useState, useEffect } from "react";
import "./Accordion.css";
import  * as Accordion from "@radix-ui/react-accordion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";
import {getItem, setItem} from "../components/LocalStorage"
import { FaChevronRight } from "react-icons/fa";






// Defines the building blocks of the accordion. id = the unique identifier of the header. title = the title of the header.
// content = the list of rows that appear when the header is clicked.
type AccordionItem = {
  id: string;
  title: React.ReactNode[];

  // list of rows, each row is a list of ReactNodes
  content?: React.ReactNode[][];
};

type AccordionProps = {
  settings_list: AccordionItem[];
};

// Takes a 2d list of accordion triggers and accordion items and displays them in accordion style
const Accordion_Component: React.FC<AccordionProps> = ({ settings_list }) => {
  const [accordionOpen, setAccordionOpen] = useState<string | undefined>(undefined);


  // This is a helper function for the titles of the accordions which contain both strings and react icons (ReactNodes).
  const renderReactNodeArray = (nodes: React.ReactNode[]) =>
    nodes.map((node, index) => <React.Fragment key={index}>{node}</React.Fragment>);

  return (
    // The accordion component given by the Radix UI library.
    <div className="accordion-container">

      <Accordion.Root
        type="single" // Only one trigger can be open at a time
        collapsible
        onValueChange={(value: string | undefined) => setAccordionOpen(value)}>

        {settings_list.map((item) => (
          <Accordion.Item key={item.id} value={item.id}>
            <Accordion.Trigger className="accordion-trigger">
              {Array.isArray(item.title) ? renderReactNodeArray(item.title) : item.title}
              <div className={`accordion-arrow ${accordionOpen === item.id ? 'rotated' : ''}`}>
                <FaChevronRight/>
              </div>

            </Accordion.Trigger>
            <Accordion.Content className="accordion-content">
              {item.content?.map((row, row_id) => (
                <div key={row_id} className="accordion-row">
                  {row.map((cell, cell_id) => (
                    <React.Fragment key={`${row_id}-${cell_id}`}>{cell}</React.Fragment>
                  ))}
                </div>
              ))}
          </Accordion.Content>
          </Accordion.Item>))}
      </Accordion.Root>
    </div>
  );
};


export default Accordion_Component;

type PrivacyDropdownProps = {
  data_field: number;
  storageKey: string;
};

export function Privacy_Dropdown({ data_field, storageKey = "Public" }: PrivacyDropdownProps) {
      const options_list = [
      "Public",
      "Friends Only",
      "Only Me"
    ]

  const [currentOption, setCurrentOption] = useState<string>(() => {
    const saved = getItem(storageKey);
    return saved !== undefined ? saved : true;
  });


  useEffect(() => {
    setItem(storageKey, currentOption);
  }, [currentOption, storageKey]);


  function filter_list(listy : string[]) {
    let filtered_list :string[] = []
      for (let index = 0; index < listy.length; index++) {
        {listy[index] === currentOption ? null : filtered_list.push(listy[index])}
      }
      return(filtered_list);
    }

    const { user } = useUser();

    const handlePrivacyChange = async (option: string) => {
      if (!user) return; // In case the user fails to be obtained

      setCurrentOption(option);
      let updated_field : string;

      if (data_field === 0){
        updated_field = "posts_privacy"
      } else if (data_field === 1) {
         updated_field = "comments_privacy"
      }else if (data_field === 2){
        updated_field = "profile_privacy"
      }
      else{ updated_field = "Error!"}

      const { data, error } = await supabase
        .from("users")
        .update({ [updated_field]: option })
        .eq("id", user.id); 

      if (error) {
        console.error("Error updating privacy:", error);
      } else{
        console.log("The users privacy has been updated to:", data)
      }
    };
  return (
    <div className="dropdown-container">
      <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild className="dropdown-button">
          <button>{currentOption}</button>
            </DropdownMenu.Trigger>
        <DropdownMenu.Content className="dropdown-options">
          {filter_list(options_list).map((option, option_index) => (
            <DropdownMenu.Item 
              className="dropdown-item"key={option_index}
              onSelect={() => handlePrivacyChange(option)}>

              {option}
            </DropdownMenu.Item>)
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}