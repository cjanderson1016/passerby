/*
    File Name: useBulletin.ts

    Description: This is a custom hook used to store global information about the Bulletin board

    Author(s): Matthew Eagleman
*/


import { useContext } from "react"; 
import { bulletinContext } from "../contexts/BulletinContextData";

export function useBulletin() {
  //Exports the useBulletin hook so you can export it without messing up fast refresh
  const context = useContext(bulletinContext);
  if (!context) {
    throw new Error("useBulletin must be used within a bulletinProvider");
  }
  return context;
}
