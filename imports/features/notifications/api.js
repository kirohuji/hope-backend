import Api from "../../api";
import Model, {
  NotificationtCollection,
  NotificationUserCollection,
} from "./collection";
import Constructor from "../base/api";
import _ from "lodash";
import { serverError500 } from "../base/api";
import { pagination } from "./service";
import { publishComposite } from "meteor/reywood:publish-composite";
Api.addCollection(NotificationtCollection);

// Constructor("notifications", Model);

// Api.addRoute("notifications/pagination", {
//   post: function () {
//     try {
//       return pagination(this.bodyParams);
//     } catch (e) {
//       return serverError500({
//         code: 500,
//         message: e.message,
//       });
//     }
//   },
// });

Api.addRoute("notifications/current/pagination", {
  post: {
    authRequired: true,
    action: function () {
      try {
        const notificationUsers = NotificationUserCollection.find(
          {
            userId: this.userId,
            isRemove: false,
            ...this.bodyParams.selector,
          },
          {
            ...this.bodyParams.options,
            fields: { notificationId: 1, isUnRead: 1, isRemove: 1 },
          }
        ).fetch();

        console.log("notificationUsers", notificationUsers);
        const notificationIds = notificationUsers.map(
          (item) => item.notificationId
        );

        const notifications = NotificationtCollection.find(
          {
            _id: { $in: notificationIds },
          },
          {
            ...this.bodyParams.options,
          }
        ).map((notification) => {
          const notificationUser = notificationUsers.find(
            (item) => item.notificationId === notification._id
          );
          return {
            ...notification,
            isUnRead: notificationUser.isUnRead,
          };
        });
        return notifications;
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});
Api.addRoute("notifications/current/checkRead/:_id", {
  post: {
    authRequired: true,
    action: function () {
      try {
        return NotificationUserCollection.update(
          {
            notificationId: this.urlParams._id,
            userId: this.userId,
          },
          {
            $set: {
              isUnRead: false,
            },
          }
        );
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});
Api.addRoute("notifications/current/overview", {
  get: {
    authRequired: true,
    action: function () {
      try {
        return NotificationUserCollection.rawCollection()
          .aggregate([
            {
              $match: { userId: this.userId, isRemove: false },
            },
            {
              $group: {
                _id: "$isUnRead",
                count: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                value: {
                  $cond: { if: "$_id", then: "unread", else: "archived" },
                },
                count: 1,
              },
            },
          ])
          .toArray();
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

// 发布
Meteor.publish("notifications", function () {
  return NotificationtCollection.find({
    target_id: this.userId,
    isRemove: false,
    isUnRead: true,
  });
});

publishComposite("userUnreadNotifications", {
  find() {
    // 这里假设你有一个名为NotificationUserCollection的集合来存储用户的通知信息
    return NotificationUserCollection.find({
      userId: this.userId,
      isUnRead: true,
      isRemove: false,
    });
  },
  children: [
    {
      find(notificationUser) {
        // 假设你有一个名为NotificationtCollection的集合来存储通知信息
        return NotificationtCollection.find({
          _id: notificationUser.notificationId,
        });
      },
    },
  ],
});
