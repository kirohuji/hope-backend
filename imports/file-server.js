import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { Picker } from "meteor/communitypackages:picker";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import * as XLSX from "xlsx/xlsx.mjs";
import * as fs from "fs";
import { pinyin } from "pinyin-pro";
import _ from "lodash";

export const Avatars = new FilesCollection({
  collectionName: "avatars",
  allowClientCode: true,
  downloadRoute: "/images/",
  storagePath: "/avatars/",
});

XLSX.set_fs(fs);
const property = new Map([
  ["姓名", "username"],
  ["展示名", "displayName"],
  ["性别", "gender"],
  ["年龄", "age"],
  ["电子邮件", "email"],
  ["手机号", "phoneNumber"],
  ["地址", "address"],
]);

async function userProcess(users, profile) {
  return Promise.all(
    users.map(async function (user) {
      let mapUser = {};
      Object.keys(user).map((key) => {
        mapUser[property.get(key)] = user[key];
      });
      if (mapUser.gender === "男") {
        mapUser.gender = "male";
      } else {
        mapUser.gender = "female";
      }
      let username = pinyin(mapUser.username, {
        pattern: "first",
        toneType: "none",
      }).replace(/\s/g, "");
      console.log("username", username);
      let usernameWithAge = `${username}${mapUser.age}`;

      let current = Meteor.users.findOne({ username: usernameWithAge });
      let _id = current?._id;
      if (!_id) {
        _id = Accounts.createUser({
          username: usernameWithAge,
          email: `${usernameWithAge}@lourd.online`,
          password: "123456",
        });
        ProfilesCollection.update(
          { _id: _id },
          {
            $set: {
              realName: mapUser.username,
              email: `${usernameWithAge}@lourd.online`,
              ..._.pick(mapUser, [
                "displayName",
                "phoneNumber",
                "age",
                "gender",
                "photoUrl",
                "country",
                "isPublic",
                "state",
                "city",
                "address",
                "about",
                "baptized",
              ]),
              available: "banned",
              scope: profile?.scope,
            },
          }
        );
        return true;
      } else {
        ProfilesCollection.update(
          { _id: _id },
          {
            $set: {
              realName: mapUser.username,
              email: `${usernameWithAge}@lourd.online`,
              ..._.pick(mapUser, [
                "displayName",
                "phoneNumber",
                "age",
                "gender",
                "photoUrl",
                "country",
                "isPublic",
                "state",
                "city",
                "address",
                "about",
                "baptized",
              ]),
              scope: profile?.scope,
            },
          }
        );
      }
      return true;
    })
  );
}

function isExcel(file) {
  return /\.(xlsx|xls|csv)$/.test(file);
}

async function excelProcess(file, profile) {
  const { SheetNames, Sheets } = XLSX.readFile(file);
  const workSheets = Sheets[SheetNames[0]];
  const data = XLSX.utils.sheet_to_row_object_array(workSheets);
  if (Array.isArray(data)) {
    await userProcess(data, profile);
  }
}

function UUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const Storage = new FilesCollection({
  collectionName: "storage",
  allowClientCode: true,
  downloadRoute: "/storage/images/",
  storagePath: "/storage/",
});

if (Meteor.isServer) {
  const _multer = require("multer");
  const _fs = require("fs");
  const _multerInstanceConfig = { dest: "/tmp" }; // Temp dir for multer
  const _multerInstance = _multer(_multerInstanceConfig);
  Picker.middleware(_multerInstance.single("file"));

  Picker.route("/storage/link:_id", function (params, req, res, next) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        link: Storage.findOne({
          "meta.userId": params._id,
        }).link(),
      })
    );
  });

  Picker.route("/storage/upload", function (params, req, res, next) {
    console.log("收到");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credential", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Auth-Token,Content-Type,Accept"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    if (
      req.file !== undefined &&
      req.file.mimetype &&
      params.query.authToken.length
    ) {
      const hashedToken = Accounts._hashLoginToken(params.query.authToken);
      const user = Meteor.users.findOne({
        "services.resume.loginTokens.hashedToken": hashedToken,
      });
      if (user) {
        _fs.stat(req.file.path, function (_statError, _statData) {
          const _addFileMeta = {
            meta: {
              uuid: UUID(),
            },
            userId: user._id,
            fileName: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size,
          };
          _fs.readFile(req.file.path, function (_readError, _readData) {
            if (_readError) {
              console.log(_readError);
            } else {
              Storage.write(
                _readData,
                _addFileMeta,
                function (_uploadError, _uploadData) {
                  if (_uploadError) {
                    console.log(_uploadError);
                  } else {
                    res.end(
                      JSON.stringify({
                        link: Storage.findOne({
                          "meta.uuid": _addFileMeta.meta.uuid,
                        }).link(),
                      })
                    );
                  }
                }
              );
            }
          });
        });
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            code: 400,
            message: "user not exsit",
          })
        );
      }
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          code: 400,
          message: "file is not or authToken is not valid",
        })
      );
    }
  });

  Picker.route("/storage/excel", async function (params, req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credential", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Auth-Token,Content-Type,Accept"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    if (
      req.file !== undefined &&
      isExcel(req.file.originalname) &&
      params.query.authToken.length
    ) {
      const hashedToken = Accounts._hashLoginToken(params.query.authToken);
      const user = Meteor.users.findOne({
        "services.resume.loginTokens.hashedToken": hashedToken,
      });
      if (user) {
        try {
          await excelProcess(req.file.path, user.profile());
          res.end(
            JSON.stringify({
              code: 200,
              message: "导入成功!",
            })
          );
        } catch (e) {
          await excelProcess(req.file.path, user.profile());
          res.end(
            JSON.stringify({
              code: 400,
              message: "导入失败!",
            })
          );
        }
      }
    }
  });

  Picker.route("/storage/avatar", function (params, req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credential", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Auth-Token,Content-Type,Accept"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    if (
      req.file !== undefined &&
      req.file.mimetype &&
      params.query.authToken.length
    ) {
      const hashedToken = Accounts._hashLoginToken(params.query.authToken);
      const user = Meteor.users.findOne({
        "services.resume.loginTokens.hashedToken": hashedToken,
      });
      if (user) {
        Avatars.remove({ "meta.userId": user._id });
        _fs.stat(req.file.path, function (_statError, _statData) {
          const _addFileMeta = {
            fileName: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size,
            meta: {
              userId: user._id,
            },
          };
          _fs.readFile(req.file.path, function (_readError, _readData) {
            if (_readError) {
              console.log(_readError);
            } else {
              Avatars.write(
                _readData,
                _addFileMeta,
                function (_uploadError, _uploadData) {
                  if (_uploadError) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(
                      JSON.stringify({
                        code: 400,
                        message: _uploadError,
                      })
                    );
                  } else {
                    res.end(
                      JSON.stringify({
                        code: 200,
                        link: Avatars.findOne({
                          "meta.userId": user._id,
                        }).link(),
                      })
                    );
                  }
                }
              );
            }
          });
        });
      }
    }
  });
}
