import * as React from 'react'
import { MenuShell, MenuActivator, Menu, MenuItem, MenuHotKey, MenuTitle } from '@chartiq/finsemble-ui/react/components/';

const FinsembleIcon = () => {
	return <img className="finsemble-toolbar-brand-logo" src="../../assets/img/Finsemble_Taskbar_Icon.png" />
}

const { useState } = React;

export const ExampleMenu = () => {
	const onClick = () => alert('You clicked');
	return (
		<MenuShell id="iconMenu">
			<MenuHotKey open={["shift", "down arrow"]} />
			<MenuHotKey close={["shift", "up arrow"]} />
			<MenuHotKey close={["escape"]} />
			<MenuActivator><FinsembleIcon /></MenuActivator>
			<Menu>
				<MenuItem>Restart</MenuItem>
				<MenuItem>Reset</MenuItem>
				<MenuTitle>My Title</MenuTitle>
				<MenuItem>Quit</MenuItem>
				<MenuItem onClick={onClick}>onClick</MenuItem>
				<MenuItem noclose="true">No close</MenuItem>
			</Menu>
		</MenuShell>
	)
}


export const ExampleMenu2 = () => {
	return (
		<MenuShell id="mymenu" className="example2">
			<MenuHotKey close={["escape"]} />
			<MenuActivator>
				My Menu
		</MenuActivator>
			<Menu>
				<MenuItem>One</MenuItem>
				<MenuItem>Two</MenuItem>
				<MenuItem>Three</MenuItem>
			</Menu>
		</MenuShell>
	)
}

export const AdvancedExample = () => {
	const [items, setItems] = useState([
		<MenuItem>Restart</MenuItem>,
		<MenuItem>Reset</MenuItem>,
		<MenuItem noclose="true">No close</MenuItem>,
		<div>
			<div>
				<div>
					<MenuItem>Deep child</MenuItem>
				</div>
			</div>
		</div>,
	]);
	const addMenuItem = () => {
		if (items.length >= 10) {return alert("Enough")}
		setItems([...items, <MenuItem>New item</MenuItem>])
	}
	return (
		<MenuShell id="advancedMenu" maxHeight={300}>
			<MenuHotKey close={["escape"]} />
			<MenuActivator>Advanced</MenuActivator>
			<Menu>
					<MenuTitle>Skip me</MenuTitle>
					<MenuItem className="add-one" noclose={true}>
					<button onClick={addMenuItem}> Add MenuItem</button>
					</MenuItem>
						{items.map(item => item)}
			</Menu>
		</MenuShell>
	)
}