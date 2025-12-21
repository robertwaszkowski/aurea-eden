# Aurea EDEN

## Libraries used

```
npm install --save three
npm install @tweenjs/tween.js
npm install --save-dev vite

```

## Run

To run the application locally for development, use the following command:

```bash
npm run dev
```

This will start the Vite development server and provide you with a local URL (usually `http://localhost:5173/`) where you can see the live-reloading demo application.

## Deployment

This project has a streamlined deployment process managed by npm scripts.

### Deploy to npm

To publish the library to npm, run the following command:

```bash
npm run deploy:npm
```

This command will publish the contents of the `dist` directory to the npm registry. Make sure you are logged in to npm (`npm login`) before running this command.

### Deploy to GitHub Pages

To deploy the demo application to GitHub Pages, run the following command:

```bash
npm run deploy:pages
```

This command uses the `gh-pages` package to publish the contents of the `dist-site` directory to the `gh-pages` branch, which is then served as a static site.

### Full Deployment (`npm run ship`)

For a full deployment, which includes versioning, building, and deploying to both npm and GitHub Pages, use the `ship` command:

```bash
npm run ship
```

This master command automates the following steps in sequence:

1.  **`npm run release`**: Bumps the version number in `package.json` and `package-lock.json`, creates a new Git tag, and generates a `CHANGELOG.md` file using `standard-version`.
2.  **`npm run update-html-version`**: Executes a custom Node.js script (`scripts/update-html-version.js`) that reads the new version from `package.json` and updates the `<title>` tag in `index.html` to include the version number (e.g., `<title>Aurea EDEN demo v1.2.3</title>`).
3.  **`npm run build:lib`**: Builds the library for distribution, outputting the files to the `dist` directory.
4.  **`npm run build:site`**: Builds the demo application, outputting the files to the `dist-site` directory.
5.  **`npm run deploy:npm`**: Publishes the library from the `dist` directory to npm.
6.  **`npm run deploy:pages`**: Deploys the demo application from the `dist-site` directory to GitHub Pages.
7.  **`npm run push:git`**: Pushes the new release and tags to the `main` branch of the Git repository.

This comprehensive command ensures that all parts of the project are versioned, built, and deployed consistently with a single command.

## Configuration

### Avoid Repeated Credential Prompts

If you want VS Code to stop asking for credentials every time you push your changes to GitLab, follow this step:

```
git config credential.helper store
```