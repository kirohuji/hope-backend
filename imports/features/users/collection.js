import { Meteor } from "meteor/meteor";
import { Class, Enum } from "meteor/jagi:astronomy";
import { User } from 'meteor/socialize:user-model';
import { UserPresence } from 'meteor/socialize:user-presence';
import SimpleSchema from 'simpl-schema';

// 待优化
const Status = Enum.create({
  name: "Status",
  identifiers: ["active", "freeze"],
});

const StatusSchema = new SimpleSchema({
  status: {
      type: String,
      optional: true,
      allowedValues: ['online', 'idle','active','banned'],
  },
  lastOnline: {
      type: Date,
      optional: true,
  },
});


export default Class.create({
  name: "User",
  collection: Meteor.users,
  fields: {
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

User.attachSchema(StatusSchema);

// If `sessionIds` is undefined this signifies we need a fresh start.
// When a full cleanup is necessary we will unset the status field to show all users as offline
UserPresence.onCleanup(function onCleanup(sessionIds) {
    if (!sessionIds) {
        Meteor.users.update({}, { $unset: { status: true } }, { multi: true });
    }
});

// When a user comes online we set their status to online and set the lastOnline field to the current time
UserPresence.onUserOnline(function onUserOnline(userId) {
    Meteor.users.update(userId, { $set: { status: 'online', lastOnline: new Date() } });
});

// When a user goes idle we'll set their status to indicate this
UserPresence.onUserIdle(function onUserIdle(userId) {
    Meteor.users.update(userId, { $set: { status: 'idle' } });
});

// When a user goes offline we'll unset their status field to indicate offline status
UserPresence.onUserOffline(function onUserOffline(userId) {
    Meteor.users.update(userId, { $unset: { status: true } });
});