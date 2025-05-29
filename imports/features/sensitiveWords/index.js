import { Meteor } from "meteor/meteor";
import "./collection";
import "./api";
import { createFilter } from "./badwords/index";
import { SensitiveWordsCollection } from "./collection";
const CryptoJS = require("crypto-js");

const SECRET_KEY = "future";
const REPLACEMENT_CHAR = "**";
const isDev = process.env.NODE_ENV !== "production";

// Initialize profanity filter with appropriate path based on environment
Meteor.filter = createFilter(
  isDev
    ? "/Users/lourd/Desktop/hope/hope-backend/imports/features/sensitiveWords/badwords/gfw.txt"
    : "/hope/gfw.txt"
);

/**
 * Encrypts a message using AES encryption
 * @param {string} message - The message to encrypt
 * @returns {string} The encrypted message
 */
const encryptMessage = (message) => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

/**
 * Decrypts an encrypted message
 * @param {string} encryptedMessage - The encrypted message
 * @returns {string} The decrypted message
 */
const decryptMessage = (encryptedMessage) => {
  return CryptoJS.AES.decrypt(encryptedMessage, SECRET_KEY).toString(CryptoJS.enc.Utf8);
};

/**
 * Replaces sensitive words with their corresponding replacements
 * @param {string} text - The text to process
 * @returns {string} The processed text with sensitive words replaced
 */
const replaceSensitiveWords = (text) => {
  const sensitiveWords = SensitiveWordsCollection.find({ status: "active" }).fetch();
  let processedText = text;
  
  sensitiveWords.forEach(({ label, replacement }) => {
    const regex = new RegExp(label, 'gi');
    processedText = processedText.replace(regex, replacement || "**");
  });
  
  return processedText;
};

/**
 * Filters profanity from text and optionally encrypts the result
 * @param {string} bodyMessage - The message to process
 * @param {boolean} isEncrypt - Whether the input message is already encrypted
 * @returns {string} The processed message
 */
Meteor.checkProfanity = function (bodyMessage, isEncrypt) {
  // Handle unencrypted input
  if (isEncrypt) {
    let sanitizedText = Meteor.filter.filter(bodyMessage, REPLACEMENT_CHAR);
    sanitizedText = replaceSensitiveWords(sanitizedText);
    return encryptMessage(sanitizedText);
  }

  // Handle encrypted input
  const decryptedMessage = decryptMessage(bodyMessage);
  let sanitizedText = Meteor.filter.filter(decryptedMessage, REPLACEMENT_CHAR);
  sanitizedText = replaceSensitiveWords(sanitizedText);

  // Only re-encrypt if profanity was found and filtered
  return sanitizedText !== decryptedMessage
    ? encryptMessage(sanitizedText)
    : bodyMessage;
};
