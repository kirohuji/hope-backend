import VersionsCollection from "./collection";
import _ from "lodash";

// 分页查询数据
export function pagination(bodyParams) {
  return {
    data: VersionsCollection.find(
      _.pickBy(bodyParams.selector, (value) => value !== null && value !== undefined && value !== '') || {},
      bodyParams.options
    ).fetch(),
    total: VersionsCollection.find(_.pickBy(bodyParams.selector) || {}).count(),
  };
}

export function active(id) {
  const version = VersionsCollection.findOne({ _id: id });
  if (!version) {
    throw new Error('Version not found');
  }
  
  VersionsCollection.update(
    { isActive: true },
    { $set: { isActive: false } },
    { multi: true }
  );
  return VersionsCollection.update(
    { _id: id },
    { $set: { isActive: !version.isActive } }
  );
}

export function getActive() {
  return VersionsCollection.findOne({ isActive: true });
}
