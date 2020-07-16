# Tracking Component
- This recipe intend to provide support for some long starting time assimilated native apps to stay alive during workspace switches.
- This TrackingComponet is used to track and save the position and bound of the the app you want to stay alive during workspace switch. 
- Notepad is used in the recipe as an exmaple. In order to switch to your app, please read section "Usage"

# Testing
- Created 5 workspaces with the following cases.
- A. Spawn a "Tracking Component" and move it to top left of your main monitor
- B. Spawn a "Tracking Component" and move it to bottom right of your main monitor
- C. Spawn a "Tracking Component" and move it to top left of your secondary monitor
- D. Spawn a "Tracking Component" and move it to bottom right of your secondary monitor
- E. An empty workspace

- Switch between workspaces and observe the location of Notepad is correctly positioned in correct monitor
- e.g.
- A -> B
- B -> A
- A -> C
- C -> D
- D -> C
- C -> E i.e. Notepad will be minimised if no "TrackingComponent" exist in the workspace.

# Usage
- In order to switch to your app, please follow the following instructions
- 1. Replace the "Notepad" component config in "src/components/TrackingComponent/config.json" with the config of the app you want to track.
- 2. In the config of "TrackingComponent" in the same config file, replace the data "Notepad" under "window->data->componentToTrack" with the component type name that you created in step 1.
- "data":{
-     "componentToTrack": "Notepad"          
- }