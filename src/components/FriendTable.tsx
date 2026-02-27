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
