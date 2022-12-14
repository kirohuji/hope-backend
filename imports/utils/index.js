import _ from 'lodash'
const labelMap = new Map([
    ['getAll', '获取全部列表'],
    ['post', '添加一条记录'],
    ['patch', '根据id替换一条记录的部分字段'],
    ['get', '根据id获取一条记录'],
    ['put', '根据id替换一条记录'],
    ['delete', '根据id删除一条记录'],
])
export function roleRequired (path, label) {
    const restful = ['getAll', 'post', 'get', 'put', 'patch', 'delete'];
    return {
        routeOptions: { authRequired: false, roleRequired: [path], label: label },
        endpoints: _.zipObject(restful, restful.map(item => generate(path, item)))

    }
}

function generate (path, element) {
    return {
        label: labelMap.get(element),
        authRequired: false, roleRequired: [`${path}.${element}`]
    }
}