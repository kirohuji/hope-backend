import { Meteor } from "meteor/meteor";
import { softremove } from "meteor/jagi:astronomy-softremove-behavior";
if (Meteor.isServer) {
  import "../imports/mock";
  import "../imports/features";
  import "../imports/file-server";
}
