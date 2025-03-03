import { Meteor } from "meteor/meteor";
export const ServiceContext = {};

ServiceContext.register = function (fct) {
  const name = fct.name;
  if (!name) {
    throw new Error("cannot register anonymous functions");
  }
  ServiceContext[name] = Meteor.bindEnvironment(fct);
};

ServiceContext.register(function notify(userId, message, next) {
  try {
    // const createdAt = new Date();
    // const insertId = Notifications.insert({
    //   userId,
    //   message,
    //   createdAt,
    // });
    // next(null, insertId);
    console.log("你好");
    next(null);
  } catch (err) {
    next(err);
  }
});
