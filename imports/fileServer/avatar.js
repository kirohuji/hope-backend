import { Picker } from "meteor/communitypackages:picker";
import { FilesCollection } from "meteor/ostrio:files";
import {
  isNotExistingFile,
  setReqConfig,
  saveFile,
  checkIsFile,
} from "./utils";
export const AvatarsCollection = new FilesCollection({
  collectionName: "storage:avatars",
  allowClientCode: true,
  downloadRoute: "/storage/avatars",
  allowedOrigins: ["*"],
  storagePath: Meteor.isDevelopment ? "./avatars/" : "/avatars/",
});
export default function avatar() {
  Picker.route("/storage/avatar", function (params, req, res, next) {
    setReqConfig(req);
    if (checkIsFile(req, params)) {
      if (checkIsFile(req, params)) {
        // 获取当前用户
        const user = getUser(params);
        if (user) {
          Avatars.remove({ "meta.userId": user._id });
          if (user) {
            if (
              !isNotExistingFile({
                collection: AvatarsCollection,
                req,
                user,
              })
            ) {
              saveFile({
                collection: AvatarsCollection,
                req,
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
      }
    }
  });
}
