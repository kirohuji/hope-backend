import { Meteor } from "meteor/meteor";
import "./collection";
import "./api";
import { createFilter } from "./badwords/index";
const CryptoJS = require("crypto-js");
const secretKey = "future";
const isDev = process.env.NODE_ENV !== "production"; // 判断是否是开发环境
Meteor.filter = createFilter(
  isDev
    ? "/Users/lourd/Desktop/hope/hope-backend/imports/features/sensitiveWords/badwords/gfw.txt"
    : "/hope/gfw.txt"
);
Meteor.checkProfanity = function (bodyMessage) {
  const decryptedMessage = CryptoJS.AES.decrypt(
    bodyMessage,
    secretKey
  ).toString(CryptoJS.enc.Utf8);
  let sanitizedText = decryptedMessage;
  sanitizedText = Meteor.filter.filter(sanitizedText, "**");
  if (sanitizedText !== decryptedMessage) {
    const checkedMessage = CryptoJS.AES.encrypt(
      sanitizedText,
      secretKey
    ).toString();
    return checkedMessage;
  }
  return bodyMessage;
}