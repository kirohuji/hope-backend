import { TaskCollection } from './collection';
import Bull from 'bull';

const taskQueue = new Bull('tasks', {
  redis: { host: '115.159.95.166', port: 6379, password: 'Zyd1362848650' },
});

// 分页查询数据
export function pagination(bodyParams) {
  let curror = TaskCollection.find(
    _.pickBy(bodyParams.selector) || {},
    bodyParams.options,
  );
  return {
    data: curror.fetch(),
    total: curror.count(),
  };
}
