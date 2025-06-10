import { Accounts } from 'meteor/accounts-base';
import {
  FileCollection,
  FileUserCollection,
} from '../features/files/collection';
const _fs = require('fs');
export function isNotExistingFile({ collection, user, req, res }) {
  const existingFileWithNameAndSize = collection.findOne({
    name: req.file.originalname,
    userId: user._id,
    size: req.file.size,
  });
  const existingFileWithName = collection.findOne({
    name: req.file.originalname,
    userId: user._id,
  });
  if (existingFileWithNameAndSize) {
    res.end(
      JSON.stringify({
        code: 200,
        uuid: existingFileWithNameAndSize.meta.uuid,
        link: collection
          .findOne({ _id: existingFileWithNameAndSize._id })
          .link(),
      }),
    );
    return true;
  }
  if (existingFileWithName) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        code: 400,
        message: `文件名重复: ${req.file.originalname}`,
      }),
    );
    return true;
  }
  return false;
}

export function setReqConfig(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credential', 'true');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Auth-Token,Content-Type,Accept',
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
}

export function saveFile({ collection, req, user, res }) {
  _fs.stat(req.file.path, function (_statError, _statData) {
    const _addFileMeta = {
      fileName: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      userId: user._id,
      createdAt: new Date(),
      meta: {
        userId: user._id,
        uuid: UUID(),
      },
    };
    _fs.readFile(req.file.path, function (_readError, _readData) {
      if (_readError) {
        console.log(_readError);
      } else {
        collection.write(
          _readData,
          _addFileMeta,
          function (_uploadError, _uploadData) {
            if (_uploadError) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  code: 400,
                  message: _uploadError,
                }),
              );
            } else {
              res.end(
                JSON.stringify({
                  code: 200,
                  uuid: _addFileMeta.meta.uuid,
                  link: collection
                    .findOne({
                      'meta.uuid': _addFileMeta.meta.uuid,
                    })
                    .link(),
                }),
              );
            }
          },
        );
      }
    });
  });
}

export function checkIsFile(req, params) {
  return (
    req.file !== undefined && req.file.mimetype && params.query.authToken.length
  );
}

export function getUser(params) {
  const hashedToken = Accounts._hashLoginToken(params.query.authToken);
  const user = Meteor.users.findOne({
    'services.resume.loginTokens.hashedToken': hashedToken,
  });
  return user;
}

export function UUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export let TOTALLIMIT = 150000000;

export async function getUserTotalSize(userId) {
  let fileIds = FileUserCollection.find({
    user_id: userId,
  }).map(fileUser => fileUser.file_id);
  const pipeline = [
    { $match: { _id: { $in: fileIds } } }, // 匹配指定用户的文件
    { $group: { _id: null, totalSize: { $sum: '$size' } } }, // 计算总和
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
