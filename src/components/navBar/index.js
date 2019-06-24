import React from "react";
import "./style.css";
import getAppRoutes from "../../routes";
import { Link } from "react-router-dom";

class NavBar extends React.Component {
    render () {
        return (
            <div className="navbar-root">
                {getAppRoutes().map(route => {
                    return <Link to={route.path}>{route.navBarTitle}</Link>
                })}
            </div>
        );
    }
}

export default NavBar;