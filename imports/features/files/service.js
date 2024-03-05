import Model, { FileCollection, FileUserCollection } from "./collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import _ from "lodash";

let TOTALLIMIT = 150000000;
async function getUserTotalSize(userId) {
  let fileIds = FileUserCollection.find({
    user_id: userId,
  }).map((fileUser) => fileUser.file_id);
  const pipeline = [
    { $match: { _id: { $in: fileIds } } }, // 匹配指定用户的文件
    { $group: { _id: null, totalSize: { $sum: "$size" } } }, // 计算总和
  ];

  const result = await FileCollection.rawCollection()
    .aggregate(pipeline)
    .toArray();
  if (result.length > 0) {
    return result[0].totalSize;
  } else {
    return 0; // 如果找不到文件，返回0
  }
}
// 创建文件
export async function createFile({ bodyParams, userId }) {
  // let totalSize = await getUserTotalSize(userId);
  // if (totalSize < TOTALLIMIT) {
  let _id = FileCollection.insert({
    ...bodyParams,
  });
  if (_id) {
    return FileUserCollection.insert({
      file_id: _id,
      user_id: userId,
      isMain: true,
    });
  } else {
    throw new Error("文件创建失败");
  }
  // } else {
  //   throw new Error("超过限制");
  // }
}

// 删除文件
export function removeFile(_id) {
  FileCollection.remove({
    _id: _id,
  });
  return FileUserCollection.remove({
    file_id: _id,
  });
}

// 更新文件
export function updateFile({ bodyParams, _id }) {
  return FileCollection.update(
    {
      _id: _id,
    },
    bodyParams
  );
}

// 根据当前用户获取所有的数据
// 待优化
export async function currentByUserId(userId) {
  let totalSize = await getUserTotalSize(userId);
  let fileUsers = FileUserCollection.find({
    user_id: userId,
  }).fetch();
  let files = fileUsers.map((item) => {
    let file = Model.findOne({ _id: item.file_id });
    let users = FileUserCollection.find({
      file_id: file._id,
    }).fetch();
    let shared = ProfilesCollection.find(
      {
        _id: {
          $in: users.map((user) => user.user_id),
        },
      },
      {
        fields: {
          photoURL: 1,
          username: 1,
          realName: 1,
          displayName: 1,
          email: 1,
        },
      }
    ).fetch();
    file.shared = shared;
    return file;
  });
  console.log(totalSize);
  return {
    files: files,
    overview: {
      used: totalSize,
    },
  };
}

// 接受文件共享
export function accpetShareFile({ userId, bodyParams }) {
  const user = ProfilesCollection.findOne({
    _id: userId,
  });

  Meteor.notifications.update(
    {
      _id: bodyParams.id,
    },
    {
      $set: {
        isRemove: true,
      },
    }
  );

  let isUpdate = Meteor.notificationsUsers.update(
    {
      userId: userId,
      notificationId: bodyParams.id || bodyParams._id,
    },
    {
      $set: {
        isRemove: true,
        isUnRead: false,
      },
    }
  );
  if (!isUpdate) throw new Error("接受文件失败,请重试");

  let newFileUser = FileUserCollection.findOne({
    file_id: bodyParams.fileId,
    user_id: userId,
    isMain: false,
  });
  if (newFileUser) {
    FileUserCollection.update(
      {
        _id: newFileUser._id,
      },
      {
        file_id: bodyParams.fileId,
        user_id: userId,
        isMain: false,
      }
    );
  } else {
    FileUserCollection.insert({
      file_id: bodyParams.fileId,
      user_id: userId,
      isMain: false,
    });
  }
  let notificationId = Meteor.notifications.insert({
    fileId: bodyParams.fileId,
    type: "chat",
    title: `<p><strong>${`${user.displayName}(${user.realName})`}</strong> 接受了你的文件共享 <strong><a href='#'>文件管理</a></strong></p>`,
    isUnRead: true,
    isRemove: false,
    publisherId: userId,
    createdAt: new Date(),
    category: "File",
  });
  Meteor.notificationsUsers.insert({
    userId: bodyParams.publisherId,
    notificationId,
    isUnRead: true,
    isRemove: false,
  });
  return true;
}

// 拒绝文件共享
export function denyShareFile({ userId, bodyParams }) {
  const user = ProfilesCollection.findOne({
    _id: userId,
  });
  let isUpdate = Meteor.notifications.update(
    {
      _id: bodyParams._id || bodyParams.id,
    },
    {
      $set: {
        isRemove: true,
      },
    }
  );
  if (!!isUpdate) throw new Error("拒绝文件失败,请重试");
  Meteor.notifications.insert({
    fileId: bodyParams.fileId || bodyParams.file_id,
    type: "chat",
    title: `<p><strong>${`${user.displayName}(${user.realName})`}</strong> 拒绝接受你的文件共享 <strong><a href='#'>文件管理</a></strong></p>`,
    isUnRead: true,
    publisherId: userId,
    isRemove: false,
    createdAt: new Date(),
    category: "File",
  });
  let profile = ProfilesCollection.findOne({
    _id: userId,
  });
  Meteor.notificationsUsers.insert({
    userId: bodyParams.publisherId,
    notificationId,
    isUnRead: true,
    isRemove: false,
  });
  return true;
}

// 邀请好友
export function inviteEmails({ userId, bodyParams }) {
  let user = ProfilesCollection.findOne({
    _id: userId,
  });
  let inviteEmails = bodyParams.inviteEmails;
  let notificationId = Meteor.notifications.insert({
    fileId: bodyParams.fileId, // 文件 id
    type: "share", // 分享类型
    title: `<p><strong>${`${user.displayName}(${user.realName})`}</strong> 共享一个文件 <strong><a href='#'>文件管理</a></strong></p>`,
    publisherId: userId,
    createdAt: new Date(),
    category: "File",
  });
  inviteEmails.forEach((inviteEmail) => {
    let profile = ProfilesCollection.findOne({
      _id: inviteEmail._id,
    });
    console.log("profile", profile);
    Meteor.notificationsUsers.insert({
      userId: profile._id,
      notificationId,
      isUnRead: true,
      isRemove: false,
    });
  });
  return true;
}
