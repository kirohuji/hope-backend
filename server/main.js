import { Meteor } from "meteor/meteor";
// import { io } from "socket.io-client";
import { softremove } from "meteor/jagi:astronomy-softremove-behavior";
if (Meteor.isServer) {

  import "../imports/mock";
  import "../imports/features";
  import "../imports/file-server";
  // const isProduction = process.env.NODE_ENV !== 'development';

  // if (!isProduction) {
  //   const httpProxy = require('http-proxy');

  //   const SSL = function (key, cert, port) {
  //     const [, , host, targetPort] = Meteor.absoluteUrl().match(/([a-zA-Z]+):\/\/([\-\w\.]+)(?:\:(\d{0,5}))?/);

  //     const proxy = httpProxy
  //       .createProxyServer({
  //         target: {
  //           host,
  //           port: targetPort,
  //         },
  //         ssl: {
  //           key,
  //           cert,
  //         },
  //         ws: true,
  //         xfwd: true,
  //       })
  //       .listen(port);

  //     proxy.on('error', err => {
  //       console.log(`HTTP-PROXY NPM MODULE ERROR: ${err}`);
  //     });

  //     console.log('PROXY RUNNING ON', port, proxy);
  //   };

  //   SSL(Assets.getText('localhost.key'), Assets.getText('localhost.cert'), 9000);
  // }
  // import "../imports/features/socket";
  // const socket = io("ws://192.168.50.164:5500");
  // Meteor.socket = socket;
  // socket.on("connect", () => {
  //   // socket.emit("upsert", state.user);
  // });

}
