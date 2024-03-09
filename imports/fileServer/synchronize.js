import { Meteor } from "meteor/meteor";

let remoteConnection; // use to connect to P via DDP

function insertUpdate(collection, doc) {
  console.log("开始图片迁移2");
  if (!collection.findOne(doc._id)) {
    console.log(`[${collection._name}]: insert ${collection.insert(doc)}`);
  } else {
    const docId = doc._id;
    delete doc._id;
    const updated = collection.update(docId, { $set: doc });
    console.log(`[${collection._name}]: update ${docId} ${updated}`);
  }
}

function getAvatars() {
  return Avatars.collection.find().fetch();
}

function getStorages() {
  return Storage.find().fetch();
}

if (Meteor.isServer) {
  Meteor.methods({ getAvatars, getStorages });
  const url = "wss://www.lourd.online";
  remoteConnection = DDP.connect(url);
  const synchronizeTracker = Meteor.bindEnvironment(synchronize);
  Tracker.autorun(synchronizeTracker);
  ArticleCollection.find({
    coverUrl: { $exists: true, $regex: "www.lourd.online" },
  }).map((item) => {
    var str = item.coverUrl;
    var newStr = str.replace("www.lourd.online", "www.lourd.top");
    ArticleCollection.update(
      {
        _id: item._id,
      },
      {
        $set: {
          coverUrl: newStr,
        },
      }
    );
  });

  ProfilesCollection.find({
    photoURL: { $exists: true, $regex: "www.lourd.online" },
  }).map((item) => {
    var str = item.photoURL;
    var newStr = str.replace("www.lourd.online", "www.lourd.top");
    ArticleCollection.update(
      {
        _id: item._id,
      },
      {
        $set: {
          photoURL: newStr,
        },
      }
    );
  });
}
export function synchronize(trackerComputation) {
  if (!remoteConnection.status().connected) return;

  console.log(remoteConnection.status());
  remoteConnection.call("getAvatars", (err, filesDocuments) => {
    filesDocuments.forEach((filesDoc) =>
      insertUpdate(Avatars.collection, filesDoc)
    );
  });
  remoteConnection.call("getStorages", (err, filesDocuments) => {
    filesDocuments.forEach((filesDoc) =>
      insertUpdate(Storage.collection, filesDoc)
    );
  });
  trackerComputation.stop();
}
