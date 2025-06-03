# Aurea EDEN

## Libraries used

```
npm install --save three
npm install @tweenjs/tween.js
npm install --save-dev vite

```

## Run
### Vite
```
npx vite
```
and open the local site: [http://localhost:5173/](http://localhost:5173/)


### Build and run
```
npm run build
npx vite
```
and open the local site [http://localhost:5173/use-lib.html](http://localhost:5173/use-lib.html)

## Deploy to npm

To publish only the library files to npm, follow these steps:

1. **Ensure your `package.json` is configured**  
    Make sure the `"files"` field in your `package.json` includes only the files you want to publish (e.g., the built library files):

    ```json
    "files": [
      "dist/bpmn-diagram.es.js",
      "dist/bpmn-diagram.umd.js"
    ]
    ```

2. **Build the library**  
    Run the build script to generate the production files:

    ```bash
    npm run build
    ```

3. **Login to npm**  
    If you haven't already, authenticate with npm:

    ```bash
    npm login
    ```

4. **Publish**  
    Publish the package to npm:

    ```bash
    npm publish
    ```

This will upload only the specified files to npm. For more details, see the [npm docs on publishing](https://docs.npmjs.com/cli/v10/commands/npm-publish).

## Deploy to GitHub Pages

GitHub Pages are configured to run deploy from the branch `gh-pages`.
You may find the configuration here: https://github.com/robertwaszkowski/aurea-eden/settings/pages.

To deploy to the `gh-pages` branch run the following command:
```terminal
npm run deploy-gh-pages
```

It runs the following commands:
```json
    "deploy-gh-pages": "npm run release && npm run build && git checkout gh-pages && rm -rf bpmn-diagram.es.js bpmn-diagram.umd.js dist && git checkout main -- dist/bpmn-diagram.es.js dist/bpmn-diagram.umd.js && mv dist/bpmn-diagram.es.js ./ && mv dist/bpmn-diagram.umd.js ./ && rm -rf dist && git add bpmn-diagram.es.js bpmn-diagram.umd.js && git commit -a -m \"Update with latest build\" && git push origin gh-pages && git checkout -",
```

This `deploy-gh-pages` script in the `package.json` is a series of commands executed sequentially to build the project and deploy the resulting build artifacts to the `gh-pages` branch of your Git repository, which is commonly used for hosting static websites on GitHub Pages.

Here's a breakdown of each command:

* `npm run release`: This command executes another npm script named `release`. It involves tasks of version bumping, creating Git tags, and generating changelogs. This step prepares the project for a new release before building.

* `npm run build`: This command executes the npm script named `build`. This script is responsible for compiling and optimizing project's source code into production-ready assets (JavaScript files). These assets are placed in the output directory - `dist`.

* `git checkout gh-pages`: This command switches your current Git branch to `gh-pages`. This is the branch that GitHub Pages serves as a website.

* `rm -rf bpmn-diagram.es.js bpmn-diagram.umd.js dist`: This command removes existing build-related files and the `dist` directory from the `gh-pages` branch. This is done to ensure that the branch is clean before copying the new build artifacts.

* `rm -rf`: This is a standard Unix/Linux command to remove files and directories recursively (-r) and forcefully (-f, without prompting).
`bpmn-diagram.es.js`, `bpmn-diagram.umd.js`, `dist`: These are the specific files and directory being removed.

* `git checkout main -- dist/bpmn-diagram.es.js dist/bpmn-diagram.umd.js`: This command checks out specific files (`bpmn-diagram.es.js` and `bpmn-diagram.umd.js`) from the `dist` directory of the `main` branch and places them into the current `gh-pages` branch. This selectively brings the newly built files from your primary development branch (`main`) into the `gh-pages` branch without merging the entire branch history.

* `mv dist/bpmn-diagram.es.js ./ and mv dist/bpmn-diagram.umd.js ./`: These commands move the checked-out build files from the `dist` directory (which was created temporarily by the previous command within the `gh-pages` branch) to the root of the `gh-pages` branch directory.

* `rm -rf dist`: This command removes the remaining `dist` directory from the `gh-pages` branch after the necessary files have been moved.

* `git add bpmn-diagram.es.js bpmn-diagram.umd.js`: This command stages the moved build files (`bpmn-diagram.es.js` and `bpmn-diagram.umd.js`) for the next commit.

* `git commit -a -m "Update with latest build"`: This command creates a new commit on the `gh-pages` branch.

    * `-a`: This flag automatically stages all modified and deleted files. In this case, it would include the files moved and the removed `dist` directory, in addition to the newly added build files.
    * `-m "Update with latest build"`: This sets the commit message to *"Update with latest build"*.

* `git push origin gh-pages`: This command pushes the newly created commit on the `gh-pages` branch to the origin remote repository on GitHub. This action updates the GitHub Pages site with the latest build.

* `git checkout -`: This command switches back to the previous branch you were on before checking out `gh-pages`. This is a convenient way to return to your working branch (`main`) after the deployment is complete.

In summary, the `deploy-gh-pages` script automates the process of building your project, cleaning up the `gh-pages` branch, copying the latest build artifacts to the root of `gh-pages`, committing these changes, and pushing them to GitHub to update your hosted website.

## Configuration

### Avoid Repeated Credential Prompts

If you want VS Code to stop asking for credentials every time you push your changes to GitLab, follow this step:

```
git config credential.helper store
```

## Library structure

The library structure and behavior are inspired by Sameer Kumar's sample JavaScript Vite library. For more details, visit the [GitHub repository](https://github.com/sameer1612/ninja-lib) and the [preparation guide](https://betterprogramming.pub/the-pragmatic-guide-to-your-first-javascript-library-516a7b08c677).

## Three.js tutorial

Useful Three.js Tutorial [here](https://sbcode.net/threejs/)
(i.e. [OrbitControls](https://sbcode.net/threejs/orbit-controls/)).

## Orthogonal connection algorithm

Drawing technology flow chart [orthogonal connection algorithm](https://pubuzhixing.medium.com/drawing-technology-flow-chart-orthogonal-connection-algorithm-fe23215f5ada).
Routing [Orthogonal Diagram Connectors in JavaScript](https://medium.com/swlh/routing-orthogonal-diagram-connectors-in-javascript-191dc2c5ff70).
Orthogonal Connector Routing example [here](https://orthogonal.jose.page/).

## GUI for testing

For testing with dat.GUI

$ npm install --save dat.gui

https://github.com/dataarts/dat.gui

## Adding automated versioning

https://muetsch.io/mastering-software-versioning-in-javascript-projects.html

Install:
```terminal
npm i --save-dev standard-version
```

Set a new version:
```terminal
npm run release
```