import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";
import { Accounts } from "meteor/accounts-base";
let users = [{ name: "admin", email: "admin@example.com", roles: ["admin"] }];

users.forEach(function (user) {
  if (
    !Meteor.users.findOne({
      username: user.name,
    })
  ) {
    let id;
    id = Accounts.createUser({
      username: user.name,
      email: user.email,
      password: "123456",
      profile: { name: user.name },
    });

    if (Meteor.roleAssignment.find({ "user._id": id }).count() === 0) {
      user.roles.forEach(function (role) {
        Roles.createRole(role, { unlessExists: true });
      });
      Roles.addUsersToRoles(id, user.roles);
    }
  }
});
