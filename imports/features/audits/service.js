import { AuditCollection } from "./collection";
import _ from "lodash";

// 分页查询数据
export function pagination(bodyParams) {
  let curror = AuditCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options
  );
  return {
    data: curror.fetch(),
    total: curror.count(),
  };
}
