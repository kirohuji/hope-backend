import Api from "../../api";
import { Meteor } from "meteor/meteor";
import { Roles } from 'meteor/alanning:roles';
import Model from "./collection";
import _ from "lodash";
Api.addCollection(
    Meteor.roles,
    {
        path: "roles",
        routeOptions: { authRequired: false },
    },
);
Api.addRoute('roles', { authRequired: false }, {
    post: function () {
        try {
            const roleName = this.bodyParams.value;
            Roles._checkRoleName(roleName)
            options = Object.assign({
                unlessExists: false
            }, {})
            let result = Meteor.roles.upsert({
                _id: roleName,
                name: this.bodyParams.label,
                type: this.bodyParams.type,
            }, { $setOnInsert: { children: [] } })
            if (!result.insertedId) {
                if (options.unlessExists) return null
                throw new Error('角色 \'' + roleName + '\' 已经存在.')
            }
            return Meteor.roles.findOne({ _id: roleName })
        } catch (e) {
            return {
                error: e.message
            }
        }
    }
})
Api.addRoute("roles/:id", {
    delete: function () {
        try {
            Roles.deleteRole(this.urlParams.id)
            return true
        } catch (e) {
            return {
                statusCode: 500
            }
        }
    },
});
Api.addRoute("roles/model", {
    get: function () {
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames,
        };
    },
});
Api.addRoute("roles/pagination", {
    post: function () {
        return {
            data: Meteor.roles
                .find({
                    ...this.bodyParams.selector,
                    type: 'role'
                } || {}, this.bodyParams.options)
                .fetch().map(item => {
                    return {
                        ...item,
                        value: item._id
                    }
                }),
            total: Meteor.roles.find().count(),
        };
    },
});
Api.addRoute("roles/renameRole", {
    post: function () {
        try {
            Roles.renameRole(this.bodyParams.oldName, this.bodyParams.newName)
            return true;
        } catch (e) {
            return {
                statusCode: 500
            }
        }
    },
});
Api.addRoute("roles/addUsersToRoles", {
    post: function () {
        try {
            Roles.addUsersToRoles(this.bodyParams.users, this.bodyParams.roles, this.bodyParams.options)
            return true;
        } catch (e) {
            return {
                statusCode: 500
            }
        }
    },
});

Api.addRoute("roles/addRolesToParent", {
    post: function () {
        try {
            Roles.addRolesToParent(this.bodyParams.rolesNames, this.bodyParams.parentName)
            return true
        } catch (e) {
            return {
                statusCode: 500
            }
        }
    },
});
Api.addRoute("roles/addRolesToParent", {
    post: function () {
        try {
            Roles.addRolesToParent(this.bodyParams.rolesNames, this.bodyParams.parentName)
            return true;
        } catch (e) {
            return {
                statusCode: 500
            }
        }
    },
});
/** 根据角色获取用户列表,类似分页 */
Api.addRoute("roles/getUsersInRole", {
    post: function () {
        try {
            let ids
            ids = Roles.getUserAssignmentsForRole(this.bodyParams.roles, this.bodyParams.options).fetch().map(a => a.user._id)
            return {
                data: Meteor.users.find({ _id: { $in: ids } }, ((this.bodyParams.options && this.bodyParams.options.queryOptions) || this.bodyParams.queryOptions) || {}).fetch(),
                total: Meteor.users.find({ _id: { $in: ids } }).count(),
            }
        } catch (e) {
            return {
                statusCode: 500
            }
        }
    },
});
Api.addRoute("roles/addPermission", {
    post: function () {
        try {
            let role = Meteor.roles.findOne({
                _id: this.bodyParams.parentName
            })
            let roles = role.children.map(item => item._id)
            let remove = _.difference(roles, this.bodyParams.rolesNames)
            Roles.removeRolesFromParent(remove, this.bodyParams.parentName)
            let add = _.difference(this.bodyParams.rolesNames, roles)
            Roles.addRolesToParent(add, this.bodyParams.parentName)
            return true
        } catch (e) {
            return {
                statusCode: 500,
            };
        }
    }
})
