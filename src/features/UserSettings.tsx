import { use, useState } from "react";
import { supabase } from "../lib/supabase";
import RouteButton from "../components/RouteButton";

export default function Settings(){
    const [user, setUser] = useState<null | any>(null);

    return (
    <div>
      <div>
        <h1>settings page!</h1>
        <RouteButton to="/">Back to Dashboard</RouteButton>
      </div>
      <div>
        
       <RouteButton to = "/reset_pass">Reset Password</RouteButton>
      </div>
    </div>
    );
}