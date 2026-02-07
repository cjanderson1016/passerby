// This is a simple test page to demonstrate routing in the Passerby app.
// It includes a button to navigate back to the main App page. This file
// will not be used in the app, but serves as an example of how we can
// build out additional pages and navigation in the future.

import RouteButton from "../../components/RouteButton";

export default function About() {
  return (
    <div>
      <h1>About Page</h1>
      <RouteButton to="/">Go to App</RouteButton>
    </div>
  );
}
