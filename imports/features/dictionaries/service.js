import { DictionaryCollection } from "./collection";
import _ from "lodash";

// 分页查询数据
export function pagination(bodyParams) {
  return {
    data: DictionaryCollection.find(
      bodyParams.selector || {},
      bodyParams.options
    ).fetch(),
    total: Model.find().count(),
  };
}

export function sync(bodyParams) {
  const receivedDicts = bodyParams;
  const dicts = DictionaryCollection.find().fetch();
  const updatedDicts = dicts
    .map((dict) => {
      const matchingReceivedDict = _.find(receivedDicts, { _id: dict._id });
      if (
        matchingReceivedDict &&
        matchingReceivedDict.version !== dict.version
      ) {
        return dict; // 保持 dicts 中的
      }
      if (!matchingReceivedDict) {
        return dict; // 需要新增 dict
      }
      return null; // 不做修改
    })
    .filter(Boolean); // 移除 null

  return {
    updated: updatedDicts,
    deleted: _.differenceBy(receivedDicts, dicts, "_id"),
  };
}
