import Api from "../../api";
Api.addCollection(Meteor.users, {
  routeOptions: { authRequired: true },
});
