import * as XLSX from "xlsx/xlsx.mjs";
import * as fs from "fs";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import { pinyin } from "pinyin-pro";
import { Picker } from "meteor/communitypackages:picker";
import { Accounts } from "meteor/accounts-base";
import _ from "lodash";
import {
  isNotExistingFile,
  setReqConfig,
  saveFile,
  checkIsFile,
} from "./utils";
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

function createUserV1({ usernameWithAge, mapUser, profile }) {
  let _id = Accounts.createUser({
    username: usernameWithAge,
    email: `${usernameWithAge}@lourd.online`,
    password: "123456",
  });
  Accounts.addEmail(_id, `${mapUser.phoneNumber}@lourd.online`, false);
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
        phoneNumber: mapUser.phoneNumber.toString(),
        available: "banned",
        scope: profile?.scope,
      },
    }
  );
}

function createUserV2({ usernameWithAge, mapUser, profile }) {
  let _id = Accounts.createUser({
    username: `${usernameWithAge}${String(mapUser.phoneNumber).slice(-4)}`,
    email: `${usernameWithAge}${String(mapUser.phoneNumber).slice(
      -4
    )}@lourd.online`,
    password: "123456",
  });
  ProfilesCollection.update(
    { _id: _id },
    {
      $set: {
        realName: mapUser.username,
        email: `${usernameWithAge}${String(mapUser.phoneNumber).slice(
          -4
        )}@lourd.online`,
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
        phoneNumber: mapUser.phoneNumber.toString(),
        available: "banned",
        scope: profile?.scope,
      },
    }
  );
  Accounts.addEmail(_id, `${mapUser.phoneNumber}@lourd.online`, false);
}

async function userProcess2(users, profile) {
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
      let usernameWithAge = `${username}${mapUser.age}`;
      let current = Meteor.users.findOne({
        emails: {
          $elemMatch: { address: `${mapUser.phoneNumber}@lourd.online` },
        },
      });
      // 存在则更新
      if (current) {
        ProfilesCollection.update(
          { _id: current._id },
          {
            $set: {
              realName: mapUser.username,
              email: current.emails[0],
              ..._.pick(mapUser, [
                "displayName",
                "age",
                "gender",
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
        Accounts.addEmail(
          current._id,
          `${mapUser.phoneNumber}@lourd.online`,
          false
        );
      } else {
        let usernameWithAgeUser = Meteor.users.findOne({
          username: usernameWithAge,
        });
        if (!usernameWithAgeUser) {
          createUserV1({
            usernameWithAge,
            mapUser,
            profile,
          });
        } else {
          createUserV2({
            usernameWithAge,
            mapUser,
            profile,
          });
        }
      }
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
    await userProcess2(data, profile);
  }
}

export default function excel() {
  Picker.route("/storage/excel", async function (params, req, res, next) {
    setReqConfig(res);
    if (
      req.file !== undefined &&
      isExcel(req.file.originalname) &&
      params.query.authToken.length
    ) {
      const hashedToken = Accounts._hashLoginToken(params.query.authToken);
      const user = Meteor.users.findOne({
        "services.resume.loginTokens.hashedToken": hashedToken,
      });
      console.log("收到");
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
}
