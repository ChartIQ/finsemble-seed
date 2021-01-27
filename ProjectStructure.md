# Project structure

Below is a brief outline of what's included in the seed project.

- _assets_ - Contains the CSS and images used to create the SmartDesktop's look and feel.

- _build/webpack_ - Includes all of the files used by the seed project to build the application.

  - _webpack.finsemble-built-in.entries.json_ - Specifies the entry and output files for the files built for a default
    SmartDesktop.

  - _webpack.components.entries.json_ - This file is where developer-added files should be listed. This file is empty in
    the base Finsemble seed project to prevent merge conflicts when updating the seed project.

  - _webpack.adapters.entries.json_ - Specifies storage adapters to be built.

- _configs_ - Contains all the necessary configuration for the SmartDesktop

  - _configs/other/server-environment-startup.json_ - Used to define the development and production server
    configurations used by the Finsemble application.

  - _configs/application_ - Contains all of the base configurations for the Finsemble application. The files in this
    folder are merged together to build the application configuration. This configuration can be changed at run time
    using dynamic configuration. Contains the application manifest used to start up the Finsemble application. The
    default manifest for development is included, and additional configurations can be placed in this folder.

- _server_ - Contains the server that hosts the built _dist_ folder for development purposes.

  - _server/server-extensions.md_ - Optional file that can be used to add functionality to the development server.

- _src_ - The folder where your Finsemble components should be placed for the Finsemble build process. It also includes
  the source for the default UI components included with the Finsemble seed project.

  - _src/adapters_ - Contains an example Storage Adapter that saves data to local storage.

  - _src/components_ - Default location of all the SmartDesktop's components, including built-in components. You can add
    to this folder automatically using Finsemble CLI (run `finsemble-cli add component --help` for more info).

  - _src/preloads_ - Default location for
    [preload scripts](https://documentation.finsemble.com/tutorial-SecurityPolicies.html#trusted-preloads).

  - _src/services_ - Default location for user-defined services. You can to this folder automatically using the
    Finsemble CLI (run `finsemble-cli add service --help` for more info).

- _gulpfile.js_ - The main gulpfile for the project includes the basic tasks used to build and run a Finsemble
  application for development.

- _gulpfile-extensions-example.js_ (optional) - File that can be used to add/modify the functionality of the gulpfile.
  This file is included to prevent conflicts when upgrading your base project.
