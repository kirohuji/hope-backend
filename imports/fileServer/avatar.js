import { Picker } from "meteor/communitypackages:picker";
import { Accounts } from "meteor/accounts-base";
import { FilesCollection } from "meteor/ostrio:files";
export const Avatars = new FilesCollection({
  collectionName: "avatars",
  allowClientCode: true,
  downloadRoute: "/images/",
  allowedOrigins: ["*"],
  storagePath: Meteor.isDevelopment ? "./avatars/" : "/avatars/",
});
const _fs = require("fs");
export default function avatar() {
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
                  }
                }
              );
            }
          });
        });
      }
    }
  });
}
