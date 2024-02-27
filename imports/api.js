import { Restivus } from "meteor/maka:rest";
let Api = new Restivus({
  apipath: "api/",
  version: "v1",
  useDefaultAuth: true,
  prettyJson: true,
  enableCors: true,
  defaultHeaders: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": true,
    "Content-Type": "application/json",
    "Access-Control-Max-Age": "86400",
  },
  onLoggedIn: function () {
    console.log(this.user.username + " (" + this.userId + ") logged in");
    // Meteor.users.update(this.userId, { $set: { status: 'online', lastOnline: new Date() } });
  },
  onLoggedOut: function () {
    console.log(this.user.username + " (" + this.userId + ") logged out");
    // Meteor.users.update(this.userId, { $unset: { status: true } });
  },
});
export default Api;
