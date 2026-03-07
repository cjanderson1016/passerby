/*
  File Name: EditBulliton.tsx

  Description: This component implements the bulliton board in the profile page.

  Author(s): Matthew Eagleman
*/

import { useState } from "react";
import "./EditBulletin.css"

interface EditBulletinProps {
    show: boolean
}

export default function EditBulletin(props: EditBulletinProps) {
    return (
        <>
            {props.show && (
                <div className = "edit-bulletin">
                    Edit Bulletin
                </div>
            )}
        </>
    );
}