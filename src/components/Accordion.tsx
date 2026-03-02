/*
  File Name: Accordion.tsx

  Description: Outlines an "accordion" feature which is a menu that displays vertically stacked headers that reveal more content 
    when clicked on. Headers may be collapsed and expanded at will by clicking on the header.

  Author(s): Owen Berkholtz
*/
import React, { useState } from "react";
import "./Accordion.css";


// Defines the building blocks of the accordion. id = the unique identifier of the header. title = the title of the header.
// content = the list of rows that appear when the header is clicked.
type AccordionItem = {
  id: string;
  title: string;

  // list of rows, each row is a list of ReactNodes
  content?: React.ReactNode[][];
};

type AccordionProps = {
  list: AccordionItem[];
};


// The main accordion function. Takes in a 2D list of items --> [ [item 1] [item 2] [item 3] ]
const Accordion_Component: React.FC<AccordionProps> = ({ list }) => {

  const [accordion, setAccordion] = useState<string | null>(null);


  //Variable that handles opening/closing an accordion
  const handleAccordion = (id: string) => {
    setAccordion(accordion === id
       ? null : id);
  };



  return (
    <div>
      {list.map((item) => (
        <div
          key={item.id}
          className="accordion_container"
          onClick={() => handleAccordion(item.id)}> {/* Opens/closes the accordion */}

          <div className="container_label">
            
            <div className="container_title">
              <span>{item.title}</span>

              <span className="container_arrow">
                {accordion === item.id ? "▼" : "►"}
              </span>
            </div>
          </div>

          {accordion === item.id && item.content && (
            <div
              className="accordion_item"
              onClick={(e) => e.stopPropagation()}
            >
              {item.content.map((row, rowIndex) => (


                <div key={rowIndex} className="accordion_row">

                  {row.map((element, elementIndex) => (

                    <span key={elementIndex} className="accordion_element">
                      {element}
                    </span>

                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Accordion_Component;