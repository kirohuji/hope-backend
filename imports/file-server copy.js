import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { Picker } from "meteor/communitypackages:picker";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import * as XLSX from "xlsx/xlsx.mjs";
import * as fs from "fs";
import { pinyin } from "pinyin-pro";
import { DDP } from "meteor/ddp-client";
import _ from "lodash";

import { ArticleCollection } from "./features/articles/collection";
const COLUMNS = [
  {
    title: "单据日期",
    key: "billDate",
    dataIndex: "billDate",
    align: "center",
    width: 120,
  },
  {
    title: "单据编号",
    key: "billNo",
    dataIndex: "billNo",
    align: "center",
    width: 200,
  },
  {
    title: "对应出库单",
    key: "billStatus",
    dataIndex: "billStatus",
    align: "center",
    width: 120,
  },
  {
    title: "客户编码",
    key: "customerNumber",
    dataIndex: "customerNumber",
    align: "center",
    width: 120,
  },
  {
    title: "客户",
    key: "customerName",
    dataIndex: "customerName",
    align: "center",
    width: 120,
  },
  {
    title: "业务员",
    key: "empName",
    dataIndex: "empName",
    align: "center",
    width: 120,
  },
  {
    title: "部门",
    key: "deptName",
    dataIndex: "deptName",
    align: "center",
    width: 120,
  },
  {
    title: "审核状态",
    key: "billStatus",
    dataIndex: "billStatus",
    align: "center",
    width: 120,
    customRender: ({ record }) => {
      return h(
        "span",
        {
          style: {
            color: record.billStatus === "C" ? "green" : "orange",
          },
        },
        record.billStatus === "C" ? "已审核" : "未审核"
      );
    },
  },
  {
    title: "收款状态",
    key: "receiveStatus",
    dataIndex: "receiveStatus",
    align: "center",
    width: 120,
  },
  {
    title: "退款状态",
    key: "refundStatus",
    dataIndex: "refundStatus",
    align: "center",
    width: 120,
  },
  {
    title: "成交金额",
    key: "dealAmount",
    dataIndex: "dealAmount",
    align: "center",
    width: 120,
  },
  {
    title: "本次应收账款",
    key: "receivableAmount",
    dataIndex: "receivableAmount",
    align: "center",
    width: 120,
  },
  {
    title: "已核销金额",
    key: "verifiedAmount",
    dataIndex: "verifiedAmount",
    align: "center",
    width: 120,
  },
  {
    title: "未核销金额",
    key: "unverifiedAmount ",
    dataIndex: "unverifiedAmount",
    align: "center",
    width: 120,
  },
  {
    title: "数量",
    key: "num",
    dataIndex: "num",
    align: "center",
    width: 120,
  },
  {
    title: "税额",
    key: "tax",
    dataIndex: "tax",
    align: "center",
    width: 120,
  },
  {
    title: "价税合计",
    key: "billStatus",
    dataIndex: "billStatus",
    align: "center",
    width: 120,
  },
  {
    title: "开票状态",
    key: "invoicedStatus",
    dataIndex: "invoicedStatus",
    align: "center",
    width: 120,
  },
  {
    title: "开票时间",
    key: "invoicedDate",
    dataIndex: "invoicedDate",
    align: "center",
    width: 120,
  },
  {
    title: "已开票金额",
    key: "invoicedAmount",
    dataIndex: "invoicedAmount",
    align: "center",
    width: 120,
  },
  {
    title: "未开票金额",
    key: "uninvoicedAmount ",
    dataIndex: "uninvoicedAmount",
    align: "center",
    width: 120,
  },
  {
    title: "发票类型",
    key: "invoiceType",
    dataIndex: "invoiceType",
    align: "center",
    width: 120,
  },
  {
    title: "发票号码",
    key: "invoiceNubmer",
    dataIndex: "invoiceNubmer",
    align: "center",
    width: 120,
  },
  {
    title: "发票备注",
    key: "invoiceRemark",
    dataIndex: "invoiceRemark",
    align: "center",
    width: 120,
  },
];

export const Avatars = new FilesCollection({
  collectionName: "avatars",
  allowClientCode: true,
  downloadRoute: "/images/",
  storagePath: "./avatars/",
});

export const Storage = new FilesCollection({
  collectionName: "storage",
  allowClientCode: true,
  downloadRoute: "/storage/images/",
  storagePath: "./storage/",
});

function insertUpdate(collection, doc) {
  console.log("开始图片迁移2");
  if (!collection.findOne(doc._id)) {
    console.log(`[${collection._name}]: insert ${collection.insert(doc)}`);
  } else {
    const docId = doc._id;
    delete doc._id;
    const updated = collection.update(docId, { $set: doc });
    console.log(`[${collection._name}]: update ${docId} ${updated}`);
  }
}

let remoteConnection; // use to connect to P via DDP

/**
 * Call the methods on the remote application and insert/update the received documents
 */
function synchronize(trackerComputation) {
  console.log("开始图片迁移");
  // skip if not yet connected
  if (!remoteConnection.status().connected) return;

  console.log(remoteConnection.status());
  remoteConnection.call("getAvatars", (err, filesDocuments) => {
    // handle err
    filesDocuments.forEach((filesDoc) =>
      insertUpdate(Avatars.collection, filesDoc)
    );
  });
  remoteConnection.call("getStorages", (err, filesDocuments) => {
    // handle err
    filesDocuments.forEach((filesDoc) =>
      insertUpdate(Storage.collection, filesDoc)
    );
  });
  // stop the tracker because we don't need to watch the connection anymore
  trackerComputation.stop();
}

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
        available: "banned",
        scope: profile?.scope,
      },
    }
  );
  Accounts.addEmail(_id, `${mapUser.phoneNumber}@lourd.online`, false);
}
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
      let usernameWithAge = `${username}${mapUser.age}`;

      let current = Meteor.users.findOne({ username: usernameWithAge });
      let _id = current?._id;
      if (!_id) {
        createUserV1({
          usernameWithAge,
          mapUser,
          profile,
        });
        return true;
      } else {
        let currentProfile = current.profile();
        if (
          currentProfile.realName === mapUser.username &&
          currentProfile.phoneNumber === mapUser.phoneNumber
        ) {
          updateUserV1({ _id, usernameWithAge, mapUser, profile });
        } else {
          let current2 = Meteor.users.findOne({
            username: `${usernameWithAge}${String(mapUser.phoneNumber).slice(
              -4
            )}`,
          });
          let _id = current2?._id;
          if (!_id) {
            createUserV2({
              usernameWithAge,
              mapUser,
              profile,
            });
          } else {
            let currentProfile = current2.profile();
            if (
              currentProfile.realName === mapUser.username &&
              currentProfile.phoneNumber === mapUser.phoneNumber
            ) {
              updateUserV2({ _id, usernameWithAge, mapUser, profile });
            }
          }
          return true;
        }
      }
      return true;
    })
  );
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
      console.log("current", current?.username);
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
        console.log("插入");
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

async function excelProcess2(file, profile) {
  const { SheetNames, Sheets } = XLSX.readFile(file);
  const workSheets = Sheets[SheetNames[0]];
  const data = XLSX.utils.sheet_to_row_object_array(workSheets);
  if (Array.isArray(data)) {
    await saleProcess(data, profile);
  }
}

async function saleProcess(sales) {
  console.log("开始");
  let data = [];
  data = sales.map(function (sale) {
    let mapSale = {};
    Object.keys(sale).map((key) => {
      let item = _.find(COLUMNS, ["title", key]);
      mapSale[item.key] = sale[key];
    });
    return mapSale;
  });
  console.log(data);
  try {
    const _ffss = require("fs");
    _ffss.writeFile(
      "/Users/lourd/Desktop/hope/hope-backend/data.json",
      JSON.stringify(data),
      { flags: "w" },
      (err) => {
        if (err) {
          console.error(`An error occurred: ${err.message}`);
          return;
        }
        console.log(`File data.json has been saved.`);
      }
    );
  } catch (e) {
    console.log(e);
  }
}

function UUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

if (Meteor.isServer) {
  // const url = "wss://www.lourd.online"; // get url of P, for example via process.env or Meteor.settings
  // remoteConnection = DDP.connect(url);

  // // use Tracker to run the sync when the remoteConnection is "connected"
  // const synchronizeTracker = Meteor.bindEnvironment(synchronize);
  // Tracker.autorun(synchronizeTracker);

  // ArticleCollection.find({
  //   coverUrl: { $exists: true, $regex: "www.lourd.online" },
  // }).map((item) => {
  //   var str = item.coverUrl;
  //   var newStr = str.replace("www.lourd.online", "www.lourd.top");
  //   ArticleCollection.update(
  //     {
  //       _id: item._id,
  //     },
  //     {
  //       $set: {
  //         coverUrl: newStr,
  //       },
  //     }
  //   );
  // });

  // ProfilesCollection.find({
  //   photoURL: { $exists: true, $regex: "www.lourd.online" },
  // }).map((item) => {
  //   var str = item.photoURL;
  //   var newStr = str.replace("www.lourd.online", "www.lourd.top");
  //   ArticleCollection.update(
  //     {
  //       _id: item._id,
  //     },
  //     {
  //       $set: {
  //         photoURL: newStr,
  //       },
  //     }
  //   );
  // });

  const _multer = require("multer");
  const _fs = require("fs");
  const _multerInstanceConfig = { dest: "/tmp" }; // Temp dir for multer
  const _multerInstance = _multer(_multerInstanceConfig);
  Picker.middleware(_multerInstance.single("file"));

  Picker.route("/storage/link/:_id", function (params, req, res, next) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        link: Storage.findOne({
          "meta.userId": params._id,
        }).link(),
      })
    );
  });

  // Picker.route("/storage/file/link/:_id", function (params, req, res, next) {
  //   res.writeHead(200, { "Content-Type": "application/json" });
  //   res.end(
  //     JSON.stringify({
  //       link: Storage.findOne({
  //         "meta.uuid": params._id,
  //       }).link(),
  //     })
  //   );
  // });

  // Picker.route("/storage/avatar/link/:_id", function (params, req, res, next) {
  //   res.writeHead(200, { "Content-Type": "application/json" });
  //   res.end(
  //     JSON.stringify({
  //       link: Storage.findOne({
  //         "meta.userId": params._id,
  //       }).link(),
  //     })
  //   );
  // });

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
                    // res.end(
                    //   JSON.stringify({
                    //     code: 200,
                    //     link: user._id,
                    //   })
                    // );
                  }
                }
              );
            }
          });
        });
      }
    }
  });
  function getAvatars() {
    return Avatars.collection.find().fetch();
  }

  function getStorages() {
    return Storage.find().fetch();
  }

  Meteor.methods({ getAvatars, getStorages });
}

Picker.route("/storage/excel2", async function (params, req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credential", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Auth-Token,Content-Type,Accept"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (
    req.file !== undefined &&
    isExcel(req.file.originalname) &&
    params.query.authToken.length
  ) {
    try {
      await excelProcess2(req.file.path);
      res.end(
        JSON.stringify({
          code: 200,
          message: "导入成功!",
        })
      );
    } catch (e) {
      res.end(
        JSON.stringify({
          code: 400,
          message: "导入失败!",
        })
      );
    }
  }
});