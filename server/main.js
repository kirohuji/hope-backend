import { Meteor } from "meteor/meteor";

if (Meteor.isServer) {
  import "../imports/mock";
  import "../imports/features";
}
