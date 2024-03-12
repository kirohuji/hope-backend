import { Meteor } from "meteor/meteor";
import { WebApp } from "meteor/webapp";
import { Picker } from "meteor/communitypackages:picker";
import message from "./message";
import avatar from "./avatar";
import excel from "./excel";
import storage from "./storage";
import book from "./book";
WebApp.connectHandlers.use("/storage/images/", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
export let STRORAGEPATH = {};

if (Meteor.isServer) {
  const _multer = require("multer");
  const _multerInstanceConfig = { dest: "/tmp" }; // Temp dir for multer
  const _multerInstance = _multer(_multerInstanceConfig);
  Picker.middleware(_multerInstance.single("file"));
  message();
  avatar();
  excel();
  storage();
  book();
}
