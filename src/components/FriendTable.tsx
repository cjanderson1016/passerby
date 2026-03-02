/*
  File Name: FriendTable.tsx

  Description: This is a simple component that takes in an array of Friend objects and renders a list of FriendProfile components. 
  It serves as the main feed on the dashboard where users can see updates from their friends.
  Each friend object should contain their most recent update, and the profiles list will be sorted/filtered based on the user's selection in the dashboard.
  
  Future: Potential enhancements could include pagination/infinite scroll for larger friend lists, and maybe some loading skeletons for better UX while data is being fetched.
  We may also move the filetering/sorting logic into this component in the future, depending on how we decide to structure our state and data fetching.

  Author(s): Connor Anderson
*/

import type { Friend } from "../types";
import FriendProfile from "./FriendProfile";

interface FriendTableProps {
  friends: Friend[];
}

export default function FriendTable({ friends }: FriendTableProps) {
  return (
    <div className="dash-feed">
      {friends.map((f) => (
        <FriendProfile key={f.id} friend={f} />
      ))}
    </div>
  );
}
