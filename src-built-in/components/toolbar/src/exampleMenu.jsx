import * as React from 'react'
import { MenuShell } from '@chartiq/finsemble-ui/lib/components/menu/menuShell'
import { MenuActivator } from '@chartiq/finsemble-ui/lib/components/menu/menuActivator'
import { Menu } from '@chartiq/finsemble-ui/lib/components/menu/menu'
import { MenuItem } from '@chartiq/finsemble-ui/lib/components/menu/menuItem'

export const ExampleMenu = () => {
	const onClick = () => alert('You clicked');
	return (
		<MenuShell id="mymenu">
			<MenuActivator>
				My menu
			</MenuActivator>
			<Menu>
				<MenuItem>Restart</MenuItem>
				<MenuItem>Reset</MenuItem>
				<MenuItem>Quit</MenuItem>
				<MenuItem onClick={onClick}>onClick</MenuItem>
				<MenuItem noclose="true">No close</MenuItem>
			</Menu>
		</MenuShell>
	)
}