import { Meteor } from "meteor/meteor";
import { softremove } from "meteor/jagi:astronomy-softremove-behavior";
if (Meteor.isServer) {
  import "../imports/initAdmin";
  import "../imports/features";
  import "../imports/fileServer/index";
  // import "../imports/cron/index";
  Meteor.methods({
    checkConnect: () => true,
  });
}
