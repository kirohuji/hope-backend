import { Meteor } from "meteor/meteor";
import "./collection";
import "./api";
import { createFilter } from "./badwords/index";
Meteor.filter = createFilter(
  "/Users/lourd/Desktop/hope/hope-backend/imports/features/sensitiveWords/badwords/gfw.txt"
);
