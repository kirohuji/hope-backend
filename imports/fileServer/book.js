import { Picker } from "meteor/communitypackages:picker";
import { FilesCollection } from "meteor/ostrio:files";
import {
  isNotExistingFile,
  setReqConfig,
  saveFile,
  checkIsFile,
} from "./utils";
export const BooksCollection = new FilesCollection({
  collectionName: "storage:books",
  allowClientCode: true,
  downloadRoute: "/storage/books",
  allowedOrigins: ["*"],
  storagePath: Meteor.isDevelopment ? "./avatars/" : "/avatars/",
});
export default function book() {
  Picker.route("/storage/book", function (params, req, res, next) {
    setReqConfig(req);
    // 文件是否存在
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
  });
}
