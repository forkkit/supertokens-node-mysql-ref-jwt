import React from 'react';
import "./App.css";
import { BrowserRouter as Router, Route } from "react-router-dom";
import getAppRoutes from "./routes";

/**
    Renders the main app component of the screen
    Takes the list of routes from the ./routes file and renders all routes
    and components accordingly.
    To add a new screen change the routes list not this file.
 */
function App() {
  return (
      <Router>
        {getAppRoutes().map(route => {
            return <Route path={route.path} exact component={route.component}/>
        })}
      </Router>
  );
}

export default App;
