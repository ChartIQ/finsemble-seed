## Spawning Groups of Components into your Workspace ##
You may wish to spawn a group of components in a predetermined layout. This is recipe demonstrates how to achieve that with the Finsemble LauncherClient API.

![](./spawn_component_group_demo.gif)

### Spawning a group ###
[spawnComponentGroup.js](./spawnComponentGroup.js) provides a utility function that allows you to spawn a group of components, group them and add them to a common linker channel. This is achieved by providing an array of objects defining the components to spawn. Each entry may either represent a single component in the form `{componentType, spawnOptions}` or a tabbed window of components in the form `{components, spawnOptions}`, where `components` is an array of single component definitions (again in the form `{componentType, spawnOptions}`). 

The group itself can be spawned at a particular location, from which each component's position is calculated. 

#### Setting a Linker group ####
The components spawned can all be added to the same group on spawn by specifying that group as the final argument to the commend. Alternatively, specify 'auto' to automatically select an unused linker group (or if none is available the least used group).

#### Example usages: ####
A group of 4 components, two of which are tabbed togeether:
```javascript
let toSpawn = [{
		"componentType": "Welcome Component",
		"spawnOptions": {"top": 0, "left": 0, "height": 400, "width": 300, "data": {}}
	},
	{
		"componentType": "Welcome Component",
		"spawnOptions": {"top": 0, "left": 300, "height": 400, "width": 500, "data": {}}
	},
	{
		"components": [
			{
				"componentType": "Welcome Component",
				"spawnOptions": {"data": {}}
			},
			{
				"componentType": "Process Monitor",
				"spawnOptions": {"data": {}}
			}
		],
		"spawnOptions": {"top": 400, "left": 0, "height": 400, "width": 800}
	}
}];
let promise = spawnComponentGroup(toSpawn, {top: 200, left: 200, linkerGroup:'auto'});
```
With % based sizing of the group and components:
```javascript
let toSpawn = [{
 			"componentType": "Welcome Component",
			"spawnOptions": {"top": 0, "left": 0, "height": "50%", "width": "40%", "data": {}}
		},
		{
			"componentType": "Welcome Component",
			"spawnOptions": {"top": 0, "left": "40%", "height": "50%", "width": "60%", "data": {}}
		},
		{
			"components": [
				{
		 			"componentType": "Welcome Component",
 					"spawnOptions": {"data": {}}
				},
				{
		 			"componentType": "Process Monitor",
 					"spawnOptions": {"data": {}}
				}
 			],
 			"spawnOptions": {"top": "50%", "left": 0, "height": "50%", "width": "100%"}
 		}];
let promise = spawnComponentGroup(toSpawn, {top: "10%", left: "10%", width: "80%", height: "80%", linkerGroup: 'auto'}); 
```

A single tabbed window:
```javascript
let toSpawn = [{
	"components": [
		{
			"componentType": "Welcome Component",
			"spawnOptions": {
				"data": {}
			}
		},
		{
			"componentType": "Process Monitor",
			"spawnOptions": {
				"data": {}
			}
		}
	],
	"spawnOptions": {
		"top": 0,
		"left": 0,
		"height": "100%",
		"width": "100%",
		"data": {}
	}
}];
```

The `spawnComponentGroup()` function can be integrated into your project in a variety of ways, for example, call it from a service or other component when you need to spawn your group. 

### Spawning a group as a Component ###
[launchGroupSpawner.js](./launchGroupSpawner.js) provides an example of using `spawnComponentGroup()` to spawn your group as a component from a Launcher menu. This is achieved by creating a dummy component with `window.options.autoShow: false` set in its config, which then spawns the group. A single, simple component implementation can be used to spawn multiple different types of groups by providing the group config as spawnData, allowing you to define the groups in your normal _/configs/application/components.json_ file. See [config.json](./config.json) for example configured groups.

### Using Percentage-based component positioning and sizing ###
Note that the internal components fo a group can be sized and positioned using percentage-based value (for top/left/bottom/right/width/height) which will be converted into pixel values automatically, based on a supplied width and height for the group (which is automatically extracted for you is you are using the `launchGroupSpawner` component). This in turn allows for the group to be sized using a percentage of the space available on the monitor (resulting in a real pixel size that will be passed onto `spawnComponentGroup()` to size the components of the group).

E.g. spawner configuration:
```json
"launchGroupSpawnerExamplePercentage2": {
	"window": {
		"url": "$applicationRoot/components/launchGroupSpawner/launchGroupSpawner.html",
		"options": {
			"resizable": true,
			"autoShow": false,
			"alwaysOnTop": false
		},
		"top": 0,
		"left": 0,
		"width": "100%",
		"height": "100%",
		"addToWorkspace": false,
		"data": {
			"addToWorkspace": true,
			"linkerGroup": "auto",
			"toSpawn": [
				{
					"componentType": "Welcome Component",
					"spawnOptions": {
						"top": 0,
						"left": 0,
						"height": "50%",
						"width": "33.33%",
						"data": {}
					}
				},
				{
					"componentType": "Welcome Component",
					"spawnOptions": {
						"top": 0,
						"left": "33.33%",
						"height": "50%",
						"width": "33.33%",
						"data": {}
					}
				},
				{
					"componentType": "Welcome Component",
					"spawnOptions": {
						"top": 0,
						"left": "66.66%",
						"height": "100%",
						"width": "33.33%",
						"data": {}
					}
				},
				{
					"componentType": "Welcome Component",
					"spawnOptions": {
						"top": "50%",
						"left": 0,
						"height": "50%",
						"width": "66.66%",
						"data": {}
					}
				}
			]
		}
	}
}
```


### Installation ###
To install and run the launchGroupSpawner examples please follow the instructions below. However, please note that you can import [spawnComponentGroup.js](./spawnComponentGroup.js) into your own code to spawn groups from services or other components.

1. Add the `launchGroupSpawner` component folder to your _/src/components_ directory.
2. Add the component to your webpack build at _/build/webpack/webpack.components.entries.json_: 
```
{
    ...
    "launchGroupSpawner": {
        "output": "components/launchGroupSpawner/launchGroupSpawner",
        "entry": "./src/components/launchGroupSpawner/launchGroupSpawner.js"
    }
    ...
}
```
3. Either add the configuration in [config.json](./config.json) to your _/configs/application/components.json_ file OR import it in your _/configs/application/config.json_ file:
```
	...,
	"importConfig": [
		...,
		"$applicationRoot/components/launchGroupSpawner/config.json"
	]
```
4. Build and run Finsemble and try launching the example component groups from the Launcher menu.
