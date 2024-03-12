import Model, { FileCollection, FileUserCollection } from "./collection";
import { AvatarsCollection } from "../../fileServer/avatar";
import { Storage } from "../../fileServer/avatar";
import {
  currentByUserId,
  createFile,
  removeFile,
  updateFile,
  accpetShareFile,
  inviteEmails,
  denyShareFile,
} from "./service";
import Api from "../../api";
import { serverError500 } from "../base/api";
import _ from "lodash";
import parse from "id3-parser";
import fs from "fs";
import { convertFileToBuffer } from "id3-parser/lib/util";

Api.addCollection(FileCollection);

Api.addRoute("files/current", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return currentByUserId(this.userId);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
  post: {
    authRequired: true,
    action: function () {
      try {
        return createFile({
          userId: this.userId,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("files/current/:_id", {
  delete: {
    authRequired: true,
    action: function () {
      try {
        return removeFile(this.urlParams._id);
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
  post: {
    authRequired: true,
    action: function () {
      try {
        return updateFile({
          _id: this.urlParams._id,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("files/current/accpetShareFile", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return accpetShareFile({
          userId: this.userId,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        console.log(e);
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("files/current/denyShareFile", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return denyShareFile({
          userId: this.userId,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("files/current/inviteEmails", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return inviteEmails({
          userId: this.userId,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("files/mp3/:_id", {
  get: {
    authRequired: true,
    action: function () {
      let file = Storage.findOne({
        _id: this.urlParams._id,
      });
      console.log("file", file);
      try {
        let tag = parse(fs.readFileSync(file.path));
        let image = AvatarsCollection.findOne({
          fileName: this.urlParams._id,
        });
        console.log("image", image);
        if (image) {
          return {
            ...tag,
            image: image.link(),
          };
        } else {
          console.log("写入");
          AvatarsCollection.write(
            tag.image.data,
            {
              fileName: this.urlParams._id,
              type: tag.image.mime,
            },
            function (_uploadError, _uploadData) {
              if (_uploadError) {
                return serverError500({
                  code: 500,
                  message: _uploadError,
                });
              } else {
                return {
                  ...tag,
                  image: AvatarsCollection.findOne({
                    fileName: this.urlParams._id,
                  }).link(),
                };
              }
            }
          );
        }
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute("files/:file_id/shared/:user_id", {
  delete: {
    authRequired: true,
    action: function () {
      return FileUserCollection.remove({
        file_id: this.urlParams.file_id,
        user_id: this.urlParams.user_id,
      });
    },
  },
});

Api.addRoute("files/check", {
  post: {
    authRequired: true,
    action: function () {
      return FileCollection.findOne({
        label: this.bodyParams.label,
      });
    },
  },
});

// 废弃
Api.addRoute("files/current/type/mp3", {
  get: {
    authRequired: true,
    action: function () {
      let fileUsers = FileUserCollection.find({
        user_id: this.userId,
      }).fetch();
      return _.compact(
        fileUsers.map((item) =>
          Model.findOne({ _id: item.file_id, type: "mp3" })
        )
      );
    },
  },
});
