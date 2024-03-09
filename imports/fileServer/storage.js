import { Picker } from "meteor/communitypackages:picker";
import { Accounts } from "meteor/accounts-base";
import { FilesCollection } from "meteor/ostrio:files";
import {
  FileCollection,
  FileUserCollection,
} from "../features/files/collection";
export const Storage = new FilesCollection({
  collectionName: "storage",
  allowClientCode: true,
  downloadRoute: "/storage/images/",
  allowedOrigins: ["*"],
  storagePath: Meteor.isDevelopment ? "./storage/" : "/storage/",
});
const _fs = require("fs");

let TOTALLIMIT = 150000000;
function UUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
async function getUserTotalSize(userId) {
  let fileIds = FileUserCollection.find({
    user_id: userId,
  }).map((fileUser) => fileUser.file_id);
  const pipeline = [
    { $match: { _id: { $in: fileIds } } }, // 匹配指定用户的文件
    { $group: { _id: null, totalSize: { $sum: "$size" } } }, // 计算总和
  ];
  const result = await FileCollection.rawCollection()
    .aggregate(pipeline)
    .toArray();
  if (result.length > 0) {
    return result[0].totalSize;
  } else {
    return 0;
  }
}

export default function strorage() {
  Picker.route("/storage/upload", async function (params, req, res, next) {
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
        let totalSize = await getUserTotalSize(user._id);
        if (totalSize > TOTALLIMIT) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              code: 400,
              message: "文件无法上传,已经超过限制!",
            })
          );
          return;
        }
        const existingFile = Storage.findOne({
          name: req.file.originalname,
          userId: user._id,
        });
        if (existingFile) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              code: 500,
              status: "fail",
              message: `文件名重复: ${req.file.originalname}`,
            })
          );
          return;
        }
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
                        uuid: _addFileMeta.meta.uuid,
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
}
