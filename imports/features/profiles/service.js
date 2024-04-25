
import { ProfilesCollection } from 'meteor/socialize:user-profile';

// 分页查询数据
export function pagination(bodyParams) {
    let curror = ProfilesCollection.find(
      _.pickBy(bodyParams.selector) || {},
      bodyParams.options
    );
    return {
      data: curror.fetch(),
      total: curror.count(),
    };
  }