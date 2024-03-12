import { Picker } from "meteor/communitypackages:picker";
import { FilesCollection } from "meteor/ostrio:files";
import {
  isNotExistingFile,
  setReqConfig,
  saveFile,
  checkIsFile,
  getUser,
  TOTALLIMIT,
  getUserTotalSize,
} from "./utils";
export const Storage = new FilesCollection({
  collectionName: "storage:manages",
  allowClientCode: true,
  downloadRoute: "/storage/manages",
  allowedOrigins: ["*"],
  storagePath: Meteor.isDevelopment ? "./storage/" : "/storage/",
});

export default function strorage() {
  Picker.route("/storage/upload", async function (params, req, res, next) {
    setReqConfig(res);
    if (checkIsFile(req, params)) {
      const user = getUser(params);
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
        if (
          !isNotExistingFile({
            collection: Storage,
            req,
            res,
            user,
          })
        ) {
          saveFile({
            collection: Storage,
            req,
            res,
            user,
          });
        }
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
