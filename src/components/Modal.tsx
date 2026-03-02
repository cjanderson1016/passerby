/*
  File Name: Modal.tsx

  Description: Generic Modal component for popups. Takes in react components and displays them in a small window with an exit button

  Author(s): Owen Berkholtz
*/

import React from "react";
import "./Modal.css";

type ModalParams = {
    is_open : boolean;
    current_state: (open :boolean) =>void;
    component: React.ReactNode;
}

const Modal : React.FC<ModalParams> = ({is_open, current_state, component}) => {
    if (!is_open) return null;
    return (
        <div className="popup_window">
            <div className=" modal_container">
                {component}
                <div className="right_corner"></div>
                    <button className="exit_btn" onClick={() => current_state(false)}>X</button>

            </div>
        </div>
    )
}

export default Modal