import VersionsCollection from "./collection";
import _ from "lodash";

// 分页查询数据
export function pagination(bodyParams) {
  return {
    data: VersionsCollection.find(
      _.pickBy(bodyParams.selector) || {},
      bodyParams.options
    ).fetch(),
    total: VersionsCollection.find(_.pickBy(bodyParams.selector) || {}).count(),
  };
}
