import { MembershipCollection } from "./collection";
import { ProfilesCollection } from "meteor/socialize:user-profile";
import _ from "lodash";

// 分页查询数据
export function pagination(bodyParams) {
  let curror = MembershipCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options
  );
  const data = curror.fetch();
  const createdByIds = _.map(data, "createdBy");
  const users = ProfilesCollection.find({ _id: { $in: createdByIds } }).fetch();
  const userMap = _.keyBy(users, "_id");
  const enhancedData = data.map((item) => {
    const user = userMap[item.createdBy]; // 使用字典查找用户信息
    return {
      ...item,
      createdUser: user && user.realName, // 假设你要显示用户的 name
    };
  });
  return {
    data: enhancedData,
    total: curror.count(),
  };
}
