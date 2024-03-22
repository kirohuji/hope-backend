import { Picker } from "meteor/communitypackages:picker";
import { FilesCollection } from "meteor/ostrio:files";
import {
  isNotExistingFile,
  setReqConfig,
  saveFile,
  getUser,
  checkIsFile,
} from "./utils";
export const BroadcastsStorage = new FilesCollection({
  collectionName: "storage:broadcasts",
  allowClientCode: true,
  downloadRoute: "/storage/broadcasts",
  allowedOrigins: ["*"],
  storagePath: Meteor.isDevelopment ? "./broadcasts/" : "/broadcasts/",
});
export default function book() {
  Picker.route("/storage/broadcasts/upload", function (params, req, res, next) {
    setReqConfig(res);
    // 文件是否存在
    if (checkIsFile(req, params)) {
      // 获取当前用户
      const user = getUser(params);
      if (user) {
        if (
          !isNotExistingFile({
            collection: BroadcastsStorage,
            req,
            res,
            user,
          })
        ) {
          saveFile({
            collection: BroadcastsStorage,
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
