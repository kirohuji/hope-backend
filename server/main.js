import { Meteor } from "meteor/meteor";
import './mock'
if (Meteor.isServer) {
  // Global API configuration
  var Api = new Restivus({
    apipath: 'api/',
    useDefaultAuth: true,
    prettyJson: true,
  });
}
