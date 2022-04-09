import { Meteor } from "meteor/meteor";
import { Restivus } from "meteor/maka:rest";
// Global API configuration
let Api = new Restivus({
  apipath: "api/",
  version: "v1",
  useDefaultAuth: true,
  prettyJson: true,
  enableCors: true,
  defaultHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    "Access-Control-Allow-Credentials": true ,
    'Content-Type': 'application/json',
    'Access-Control-Max-Age': '86400',
 },
  onLoggedIn: function () {
    console.log(this.user.username + " (" + this.userId + ") logged in");
    // return {
    //   ...Meteor.users.findOne({
    //     id: this.userId
    //   })
    // }
    // this.response.write('This is a manual response');
    // this.done();
  },
  onLoggedOut: function () {
    console.log(this.user.username + " (" + this.userId + ") logged out");
  },
});
export default Api;
