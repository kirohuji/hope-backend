import ScopesCollection from './collection'
import _ from 'lodash'

// 分页查询数据
export function pagination (bodyParams) {
  return {
    data: ScopesCollection.find(_.pickBy(bodyParams.selector) || {}, bodyParams.options).fetch(),
    total: ScopesCollection.find().count()
  }
}