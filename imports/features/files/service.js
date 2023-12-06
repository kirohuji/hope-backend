import Model, { FileCollection, FileUserCollection } from './collection';
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import _ from 'lodash';

// 创建文件
export function createFile ({
  bodyParams,
  userId
}) {
  let _id = FileCollection.insert({
    ...bodyParams,
  });
  if (_id) {
    return FileUserCollection.insert({
      file_id: _id,
      user_id: userId,
      isMain: true
    })
  } else {
    throw new Error('文件创建失败');
  }
}

// 删除文件
export function removeFile (_id) {
  FileCollection.remove({
    _id: _id
  });
  return FileUserCollection.remove({
    file_id: _id
  });
}

// 更新文件
export function updateFile ({
  bodyParams,
  _id
}) {
  return FileCollection.update({
    _id: _id
  }, bodyParams);
}

// 根据当前用户获取所有的数据
// 待优化
export function currentByUserId (userId) {
  let files = FileUserCollection.find({
    user_id: userId,
  }).fetch();
  return files.map(item => {
    let file = Model.findOne({ _id: item.file_id })
    let users = FileUserCollection.find({
      file_id: file._id,
    }).fetch()
    let shared = ProfilesCollection.find({
      _id: {
        $in: users.map(user => user.user_id)
      }
    }, {
      fields: {
        photoURL: 1,
        username: 1
      }
    }).fetch()
    file.shared = shared;
    return file;
  })
}


// 接受文件共享
export function accpetShareFile ({
  userId,
  bodyParams
}) {
  const user = ProfilesCollection.findOne({
    _id: userId
  })

  let isUpdate = Meteor.notifications.update({
    _id: bodyParams.id
  }, {
    $set: {
      isRemove: true,
    }
  })
  console.log('isUpdate', isUpdate)
  if (!isUpdate) throw new Error('接受文件失败,请重试')

  let newFileUser = FileUserCollection.findOne({
    file_id: bodyParams.file_id,
    user_id: userId,
    isMain: false
  })
  if (newFileUser) {
    FileUserCollection.update({
      _id: newFileUser._id
    }, {
      file_id: bodyParams.file_id,
      user_id: userId,
      isMain: false
    })
  } else {
    FileUserCollection.insert({
      file_id: bodyParams.file_id,
      user_id: userId,
      isMain: false
    })
  }
  return Meteor.notifications.insert({
    file_id: bodyParams.file_id,
    type: 'chat',
    title: `<p><strong>${user.displayName}</strong> 接受了你的文件共享 <strong><a href='#'>文件管理</a></strong></p>`,
    isUnRead: true,
    isRemove: false,
    publisher_id: userId,
    target_id: bodyParams.publisher_id,
    createdAt: new Date(),
    category: "File",
  });
}

// 拒绝文件共享
export function denyShareFile ({
  userId,
  bodyParams
}) {
  const user = ProfilesCollection.findOne({
    _id: userId
  })
  let isUpdate = Meteor.notifications.update({
    _id: bodyParams._id || bodyParams.id
  }, {
    $set: {
      isRemove: true,
    }
  })
  if (!!isUpdate) throw new Error('拒绝文件失败,请重试')
  return Meteor.notifications.insert({
    file_id: bodyParams.file_id,
    type: 'chat',
    title: `<p><strong>${user.displayName}</strong> 拒绝接受你的文件共享 <strong><a href='#'>文件管理</a></strong></p>`,
    isUnRead: true,
    publisher_id: bodyParams.target_id,
    isRemove: false,
    target_id: bodyParams.publisher_id,
    createdAt: new Date(),
    category: "File",
  });
}

// 邀请好友
export function inviteEmails ({
  userId,
  bodyParams
}) {
  let inviteEmails = bodyParams.inviteEmails;
  inviteEmails.forEach(inviteEmail => {
    const user = ProfilesCollection.findOne({
      username: inviteEmail.username
    })
    Meteor.notifications.insert({
      file_id: bodyParams.fileId,
      type: 'share',
      title: `<p><strong>${user.displayName}</strong> 共享一个文件 <strong><a href='#'>文件管理</a></strong></p>`,
      isUnRead: true,
      publisher_id: userId,
      target_id: user._id,
      createdAt: new Date(),
      isRemove: false,
      category: "File",
    });
  });
  return true;
}