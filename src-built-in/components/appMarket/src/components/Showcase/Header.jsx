/*!
* Copyright 2017 by ChartIQ, Inc.
* All rights reserved.
*/
/**
 * This component is the name of a component and a pin that will pin that component to all toolbars.
 *
 */
import React from "react";

const Header = props => {
	return (
		<div className="header">
			<div className='icon-title-container'>
				<img className="header-icon" src={props.iconUrl} />
				<span className="appName">{props.name}</span>
			</div>
			<div className='action-button-container'>
				{props.installed ? <button className={props.entitled ? "action-button disabled" : "action-button remove"} disabled={props.entitled} onClick={props.appAction}>
					<div className='remove-button' onClick={this.removeApp}>
						&nbsp;Remove
					</div>
				</button> : null}
				<button className={props.entitled ? "action-button disabled" : "action-button open"} disabled={props.entitled} onClick={props.appAction}>
					{props.installed ? (
						<div>
							<span className="action-button-label">Open</span>
						</div>
					) : (
						<span className="action-button-label">
							<i className="ff-plus"></i>
							&nbsp;My Apps
						</span>
					)}
				</button>
			</div>
		</div>
	);
}

export default Header;