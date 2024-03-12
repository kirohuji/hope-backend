import { Picker } from "meteor/communitypackages:picker";
import { FilesCollection } from "meteor/ostrio:files";
import {
  isNotExistingFile,
  setReqConfig,
  saveFile,
  getUser,
  checkIsFile,
} from "./utils";
export const BooksStorage = new FilesCollection({
  collectionName: "storage:books",
  allowClientCode: true,
  downloadRoute: "/storage/books",
  allowedOrigins: ["*"],
  storagePath: Meteor.isDevelopment ? "./avatars/" : "/avatars/",
});
export default function book() {
  Picker.route("/storage/books/upload", function (params, req, res, next) {
    setReqConfig(res);
    // 文件是否存在
    if (checkIsFile(req, params)) {
      // 获取当前用户
      const user = getUser(params);
      if (user) {
        if (
          !isNotExistingFile({
            collection: BooksStorage,
            req,
            res,
            user,
          })
        ) {
          saveFile({
            collection: BooksStorage,
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
