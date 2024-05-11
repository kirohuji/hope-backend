import AiModelsCollection from './collection'
import _ from 'lodash'

// 分页查询数据
export function pagination (bodyParams) {
  return {
    data: AiModelsCollection.find(_.pickBy(bodyParams.selector) || {}, bodyParams.options).fetch(),
    total: AiModelsCollection.find().count()
  }
}