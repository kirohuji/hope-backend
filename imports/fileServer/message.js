import { Picker } from "meteor/communitypackages:picker";
import { FilesCollection } from "meteor/ostrio:files";
import {
  isNotExistingFile,
  setReqConfig,
  saveFile,
  checkIsFile,
} from "./utils";
export const Messagees = new FilesCollection({
  collectionName: "storage:messages",
  allowClientCode: true,
  downloadRoute: "/storage/messages",
  allowedOrigins: ["*"],
  storagePath: Meteor.isDevelopment ? "./messages/" : "/messages/",
});
const _fs = require("fs");
export default function messages() {
  Picker.route(
    "/storage/messages/upload",
    async function (params, req, res, next) {
      setReqConfig(req);
      if (checkIsFile(req, params)) {
        // 获取当前用户
        const user = getUser(params);
        if (user) {
          if (
            !isNotExistingFile({
              collection: BooksCollection,
              req,
              user,
            })
          ) {
            saveFile({
              collection: BooksCollection,
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
  );
}
