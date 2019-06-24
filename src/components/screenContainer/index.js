import React from 'react';
import './style.css';
import NavBar from "../navBar";

class ScreenContainer extends React.Component {
    renderChildren() {
        return this.props.children;
    }

    render() {
        return (
            <div className="screen-container-root">
                <div>
                    <NavBar/>
                </div>
                <div className="screen-container-child">
                    {this.renderChildren()}
                </div>
            </div>
        );
    }
}

export default ScreenContainer;