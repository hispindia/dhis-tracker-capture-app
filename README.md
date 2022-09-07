# tracker-capture-app
DHIS2 Tracker Capture App

## Contribute

### Set up the development environment

> **Note:** The setup has been tested with yarn. You can install yarn through npm by running `npm install -g yarn`. For more info > on yarn check out https://yarnpkg.com/.

### build the application

```
yarn install

yarn build
```

### Running the devevelopment server

To run the development server you can run the following command.

```
yarn start
```

This starts the development server on port `8081`.

### Custom Changes for WHO-LEP-Nikushta-v38 for Display images in Dataentry Screen 
```
For displaying images, files Added/Updated: 
Added: styles/custom.css
Added: styles/img.css
added : inside index.ejs line no 20 -- <link type="text/css" rel="stylesheet" media="screen" href="./styles/custom.css" />
Modified: components/dataentry/default-form.html add for sections start from line 83 to 461
Modified: components/dataentry/dataentry-controller.js start from line 607 to 905 (Search 'Custom Changes' and commented code can be found )

```
