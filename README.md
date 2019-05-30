
# Web screen sharing (Hackaton 2019)

#### Attended screen sharing without agent or plugin from WIN, MAC, LIN platforms. Utilize knowledge gained during video chat development (WebRTC framework) and create free screen sharing cooperation tool similar to https://www.join.me

## Steps to start this project

> Preparing the Janus server through [Docker image](https://github.com/atyenoria/janus-webrtc-gateway-docker)

1. git clone https://github.com/atyenoria/janus-webrtc-gateway-docker.git && cd janus-webrtc-gateway-docker
1. docker build -t atyenoria/janus-webrtc-gateway-docker .
1. docker run --rm -p 80:80 -p 8088:8088 -p 8188:8188 --name="janus" -it -t atyenoria/janus-webrtc-gateway-docker


        Janus commit: ddbf37fef43ade61d73173c7661a2449c13582d4
        Compiled on:  Thu May 30 11:41:13 UTC 2019

        ---------------------------------------------------
        Starting Meetecho Janus (WebRTC Server) v0.6.2
        ---------------------------------------------------

Now we should see after accessing `localhost:8088` something in standard output from docker run.

    [ERR] [transports/janus_http.c:janus_http_handler:1225] Invalid url /



---------------


This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
