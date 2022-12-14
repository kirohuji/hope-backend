import Api from "../../api";
import Model, { RouteCollection } from './collection'
import { Roles } from 'meteor/alanning:roles';
import _ from 'lodash'
Api.addCollection(RouteCollection, {
    path: 'routes'
});
Api.addRoute('routes/model', {
    get: function () {
        console.log()
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('routes/pagination', {
    post: function () {
        return {
            data: RouteCollection.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch(),
            total: Model.find().count()
        }
    }
});


Api.addRoute('routes/generate', {
    get: function () {
        RouteCollection.remove({});
        console.log(Api._routes[21])
        Api._routes.forEach(element => {
            RouteCollection.insert({
                label: element.path,
                value: element.path,
                path: element.path,
                options: element.options,
                endpoints: element.endpoints
            })
        });
        return true;
    }
});

Api.addRoute('routes/refresh', {
    get: function () {
        Meteor.roles.remove({
            "class": "operation",
            type: 'permission'
        });
        const routes = [];
        Meteor.roles.insert({
            "value": "interfaces",
            label: '后台所有操作权限(routes)',
            "scope": "BaGCFbhYhcaiE2hh3",
            "type": "permission",
            "class": "operation",
            root: true,
            children: [],
            _id: 'interfaces',
            "key": 'interfaces'
        })
        Api._routes.forEach(element => {
            if (element.options && element.options.authRequired) {
                options = Object.assign({
                    unlessExists: false
                }, {})

                /** 添加 */
                if (element.options.roleRequired[0]) {
                    const result = Meteor.roles.findOne({
                        "_id": element.options.roleRequired[0],
                    })
                    if (!result) {
                        routes.push(element.options.roleRequired[0]);
                        Meteor.roles.insert({
                            "value": element.options.roleRequired[0],
                            label: element.options.label,
                            "scope": "BaGCFbhYhcaiE2hh3",
                            "type": "permission",
                            "class": "operation",
                            children: [],
                            _id: element.options.roleRequired[0],
                            "key": element.options.roleRequired[0],
                        })
                    }
                    const endpoints = _.omit(element.endpoints, ['options'])
                    const roles = []
                    if (Object.keys(endpoints).length > 0) {
                        Object.keys(endpoints).forEach(endpoint => {
                            if (endpoints[endpoint].authRequired) {
                                endpoints[endpoint].roleRequired.forEach(role => {
                                    if (role != element.options.roleRequired[0]) {
                                        roles.push(role);
                                        Meteor.roles.upsert({
                                            "_id": role
                                        }, {
                                            children: [],
                                            "value": role,
                                            label: endpoints[endpoint].label,
                                            "scope": "BaGCFbhYhcaiE2hh3",
                                            "type": "permission",
                                            "class": "operation",
                                            "key": role,
                                        })
                                    }
                                })
                            }
                        })
                        Roles.addRolesToParent(_.uniq(roles), element.options.roleRequired[0])
                    }
                }
            }
        });
        Roles.addRolesToParent(_.uniq(routes), 'interfaces')
        return true;
    }
});
