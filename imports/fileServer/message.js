import { Picker } from "meteor/communitypackages:picker";
import { FilesCollection } from "meteor/ostrio:files";
import {
  isNotExistingFile,
  setReqConfig,
  saveFile,
  getUser,
  checkIsFile,
} from "./utils";
export const MessageesStorage = new FilesCollection({
  collectionName: "storage:messages",
  allowClientCode: true,
  downloadRoute: "/storage/messages",
  allowedOrigins: ["*"],
  storagePath: Meteor.isDevelopment ? "./messages/" : "/messages/",
});
export default function messages() {
  Picker.route(
    "/storage/messages/upload",
    async function (params, req, res, next) {
      setReqConfig(res);
      if (checkIsFile(req, params)) {
        // 获取当前用户
        const user = getUser(params);
        if (user) {
          if (
            !isNotExistingFile({
              collection: MessageesStorage,
              req,
              res,
              user,
            })
          ) {
            saveFile({
              collection: MessageesStorage,
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
    }
  );
}
