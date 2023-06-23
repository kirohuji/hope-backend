import { Meteor } from "meteor/meteor";
import { Class, Enum } from "meteor/jagi:astronomy";

const Status = Enum.create({
  name: "Status",
  identifiers: ["active", "freeze"],
});
export default Class.create({
  name: "User",
  collection: Meteor.users,
  fields: {
    avatar: {
      type: String,
    },
    username: {
      type: String,
    },
    password: {
      type: String,
      default: '',
    },
    emails:[Object]
  }
});
