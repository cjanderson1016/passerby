import React, { useState } from "react";
import "./Accordion.css";

type AccordionItem = {
  id: string;
  title: string;

  // list of rows, each row is a list of ReactNodes
  content?: React.ReactNode[][];
};

type AccordionProps = {
  list: AccordionItem[];
};

const Accordion_Component: React.FC<AccordionProps> = ({ list }) => {

  const [accordion, setAccordion] = useState<string | null>(null);

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
          onClick={() => handleAccordion(item.id)}>

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