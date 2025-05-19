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