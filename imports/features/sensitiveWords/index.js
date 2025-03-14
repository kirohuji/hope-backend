import { Meteor } from "meteor/meteor";
import "./collection";
import "./api";
import { createFilter } from "./badwords/index";

const isDev = process.env.NODE_ENV !== "production"; // 判断是否是开发环境
Meteor.filter = createFilter(
  isDev
    ? "/Users/lourd/Desktop/hope/hope-backend/imports/features/sensitiveWords/badwords/gfw.txt"
    : "/hope/gfw.txt"
);
