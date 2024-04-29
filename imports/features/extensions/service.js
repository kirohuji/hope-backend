import ExtensionCollection from "./collection";
import _ from "lodash";

// 分页查询数据
export function pagination(bodyParams) {
  return {
    data: ExtensionCollection.find(
      _.pickBy(bodyParams.selector) || {},
      bodyParams.options
    ).fetch(),
    total: ExtensionCollection.find(_.pickBy(bodyParams.selector) || {}).count(),
  };
}
