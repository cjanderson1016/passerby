/*
  File Name: ToggleButton.tsx

  Description: Adds a snazzy button that slides on/off. Style sheet can be found in "settings.css"

  Author(s): Owen Berkholtz
*/

import { useState, useEffect } from "react";
import "../features/settings.css"
import {getItem, setItem} from "../components/LocalStorage"

function Toggle({ storageKey = "toggle-default" }) {

  const [isToggled, setIsToggled] = useState<boolean>(() => {
    const saved = getItem(storageKey);
    return saved !== undefined ? saved : true;
  });

  useEffect(() => {
    setItem(storageKey, isToggled);
  }, [isToggled, storageKey]);
  return (
    <button
      className={`toggle-button ${isToggled ? "isToggled" : ""}`}
      onClick={() => setIsToggled(!isToggled)}
    >
      <div className="circle"></div>
    </button>
  );
}

export default Toggle;