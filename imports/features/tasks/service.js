
import { TaskCollection } from './collection'

// 分页查询数据
export function pagination(bodyParams) {
    let curror = TaskCollection.find(
      _.pickBy(bodyParams.selector) || {},
      bodyParams.options
    );
    return {
      data: curror.fetch(),
      total: curror.count(),
    };
  }