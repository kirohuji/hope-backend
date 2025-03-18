import { AuditCollection } from "./collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import { PostsCollection } from "meteor/socialize:postable";
import _ from "lodash";
import moment from "moment";

// 分页查询数据
export function pagination(bodyParams) {
  if (bodyParams.selector && bodyParams.selector.status == "all") {
    bodyParams.selector = _.pickBy(_.omit(bodyParams.selector, ["status"]));
  }
  if (bodyParams.selector && bodyParams.selector.category.length === 0) {
    bodyParams.selector = _.pickBy(_.omit(bodyParams.selector, ["category"]));
  } else if (bodyParams.selector && bodyParams.selector.category.length > 0) {
    bodyParams.selector = {
      ..._.pickBy(bodyParams.selector),
      category: {
        $in: bodyParams.selector.category,
      },
    };
  }
  let curror = AuditCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options
  );
  const data = curror.fetch();
  const createdByIds = _.map(data, "createdBy");
  const reviewerByIds = _.map(
    data.filter((item) => item.reviewerId),
    "reviewerId"
  );
  const users = ProfilesCollection.find({ _id: { $in: createdByIds } }).fetch();
  const reviewers = ProfilesCollection.find({
    _id: { $in: reviewerByIds },
  }).fetch();
  const reviewersMap = _.keyBy(reviewers, "_id");
  const userMap = _.keyBy(users, "_id");
  const enhancedData = data.map((item) => {
    const user = userMap[item.createdBy]; // 使用字典查找用户信息
    const reviewer = reviewersMap[item.reviewerId]; // 使用字典查找用户信息
    return {
      ...item,
      createdUser: user, // 假设你要显示用户的 name
      reviewer: reviewer,
    };
  });
  return {
    data: enhancedData,
    total: curror.count(),
  };
}

export function moderation(bodyParams) {
  if(bodyParams.category === "内容分享"){
    PostsCollection.update({
      _id: bodyParams.sourceId	,
    }, {
      $set: {
        status: "published",
        publishedAt: moment(new Date()).toISOString()
      },
    })
  }
  return AuditCollection.update(
    {
      _id: bodyParams._id,
    },
    {
      $set: {
        status: bodyParams.status,
        reason: bodyParams.reason,
        reviewerId: bodyParams.reviewerId,
      },
    }
  );
}
