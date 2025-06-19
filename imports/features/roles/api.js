import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import Model, { RuleRole, RuleAssignment } from './collection';
import { ScopeCollection } from '../scopes/collection';
import Api from '../../api';
import { serverError500 } from '../base/api';
import _ from 'lodash';
import {
  getRolesByCurrentUser,
  getRolesTreeByCurrentUser,
  permissionTree,
  getUsersInNotRoleOnly,
  RoleError,
  createRole,
  addRolesToParent,
  updateRolesToParent,
  getRoleById,
  updateRole,
  deleteRoleById,
  getRolesPagination,
  renameRole,
  changeLeader,
  removeUsersFromRoles,
  getInheritedRoleNames,
  addRules,
  removeRules,
  getChildrenRoleNames,
  getChildrenRoleNamesWithUser,
  getInheritedRoleNamesOnly,
  removeUsersFromRolesAndInheritedRole,
  addUsersToRolesAndRoleParents,
  addUsersToRoles,
  getUsersInRole,
  getUsersInRoleOnly,
  getUsersInNotRole,
  addPermission,
  getRoles,
  addCurrentUserToRolesAndRoleParents,
  getRoleWithUser,
  getMaxRole
} from './service';
Api.addCollection(Meteor.roles);

Api.addRoute('roles/permissions', {
  get: function () {
    try {
      return permissionTree({
        selector: this.bodyParams.selector,
        options: this.bodyParams.options,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});
/** 创建一个节点 */
Api.addRoute(
  'roles',
  { authRequired: false },
  {
    post: function () {
      try {
        return createRole({
          _id: this.bodyParams._id,
          bodyParams: this.bodyParams,
        });
      } catch (e) {
        return serverError500({
          code: e instanceof RoleError ? e.code : 500,
          message: e.message,
        });
      }
    },
  },
);

/** 添加父节点 */
Api.addRoute('roles/addRolesToParent', {
  post: function () {
    try {
      return addRolesToParent({
        rolesNames: this.bodyParams.rolesNames,
        parentName: this.bodyParams.parentName,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

/** 添加父节点 */
Api.addRoute('roles/updateRolesToParent', {
  post: function () {
    try {
      return updateRolesToParent({
        rolesNames: this.bodyParams.rolesNames,
        parentName: this.bodyParams.parentName,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/:id', {
  get: function () {
    try {
      return getRoleById(this.urlParams.id);
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
  patch: function () {
    try {
      return updateRole({
        id: this.urlParams.id,
        bodyParams: this.bodyParams,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
  delete: function () {
    try {
      return deleteRoleById(this.urlParams.id);
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/model', {
  get: function () {
    return {
      fields: Model.schema.fields,
      fieldsNames: Model.schema.fieldsNames,
    };
  },
});

Api.addRoute('roles/pagination', {
  post: function () {
    try {
      return getRolesPagination({
        selector: this.bodyParams.selector,
        options: this.bodyParams.options,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/renameRole', {
  post: function () {
    try {
      return renameRole({
        oldName: this.bodyParams.oldName,
        newName: this.bodyParams.newName,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/changeLeader', {
  post: function () {
    try {
      return changeLeader({
        _id: this.bodyParams._id,
        bodyParams: this.bodyParams,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

// Api.addRoute("roles/removeUsersFromRoles", {
//   post: function () {
//     try {
//       Roles.removeUsersFromRoles(this.bodyParams.users, this.bodyParams.roles, this.bodyParams.options)
//       const role = Meteor.roles.findOne({ _id: this.bodyParams.roles })
//       const currentRolesNames = _.compact(Meteor.roles.find({
//         _id: {
//           $in: Roles._getInheritedRoleNames(role)
//         }
//       }).fetch())
//       const permissions = currentRolesNames.map(item => item.type == 'permission' && item._id);
//       permissions.forEach(permission => {
//         const ruleRoles = RuleRole.find({
//           role_id: permission,
//         }).fetch()
//         ruleRoles.forEach(e => {
//           const ruleAssignment = RuleAssignment.findOne({
//             user_id: this.bodyParams.users._id,
//             role_id: e.role_id,
//             rule_value: e.rule_value,
//             router: e.router
//           })
//           ruleAssignment.remove()
//         })
//       })
//       return true;
//     } catch (e) {
//       return {
//         statusCode: 500
//       }
//     }
//   },
// });

Api.addRoute('roles/removeUsersFromRoles', {
  post: function () {
    try {
      return removeUsersFromRoles({
        users: this.bodyParams.users,
        roles: this.bodyParams.roles,
        options: this.bodyParams.options,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/getInheritedRoleNames', {
  post: function () {
    try {
      return getInheritedRoleNames({
        _id: this.bodyParams._id,
        type: this.bodyParams.type,
        filter: this.bodyParams.filter,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

export function _getInheritedRoleNames(role) {
  const inheritedRoles = new Set();
  const nestedRoles = new Set([]);
  const _init_roles = Meteor.roles
    .find(
      { _id: { $in: role.children.map(r => r._id) } },
      { fields: { children: 1 } },
    )
    .fetch();
  _init_roles.forEach(r2 => {
    nestedRoles.add(r2);
  });
  nestedRoles.forEach(r => {
    const roles = Meteor.roles
      .find(
        { _id: { $in: r.children?.map(r => r._id) || [] } },
        { fields: { children: 1 } },
      )
      .fetch();
    roles.forEach(r2 => {
      inheritedRoles.add(r2._id);
      nestedRoles.add(r2);
    });
  });

  return [...inheritedRoles];
}

Api.addRoute('roles/getInheritedRoleNamesOnly', {
  post: function () {
    try {
      return getInheritedRoleNamesOnly({
        _id: this.bodyParams._id,
        type: this.bodyParams.type,
        filter: this.bodyParams.filter,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/getChildrenRoleNamesWithUser', {
  post: function () {
    try {
      return getChildrenRoleNamesWithUser({
        _id: this.bodyParams._id,
        type: this.bodyParams.type,
        filter: this.bodyParams.filter,
        query: this.bodyParams.query,
        scope: this.bodyParams.scope,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/getChildrenRoleNames', {
  post: function () {
    try {
      return getChildrenRoleNames({
        _id: this.bodyParams._id,
        type: this.bodyParams.type,
        filter: this.bodyParams.filter,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/removeUsersFromRolesAndInheritedRole', {
  post: function () {
    try {
      return removeUsersFromRolesAndInheritedRole({
        users: this.bodyParams.users,
        roles: this.bodyParams.roles,
        options: this.bodyParams.options,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/addUsersToRolesAndRoleParents', {
  post: function () {
    try {
      return addUsersToRolesAndRoleParents({
        users: this.bodyParams.users,
        roles: this.bodyParams.roles,
        options: this.bodyParams.options,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/addUsersToRoles', {
  post: function () {
    try {
      return addUsersToRoles({
        users: this.bodyParams.users,
        roles: this.bodyParams.roles,
        options: this.bodyParams.options,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

/** 根据角色获取用户列表,类似分页 */
Api.addRoute('roles/getUsersInRole', {
  post: function () {
    try {
      return getUsersInRole({
        roles: this.bodyParams.roles,
        options: this.bodyParams.options,
        queryOptions: this.bodyParams.queryOptions,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

function getUserAssignmentsForRoleOnly(roles, options) {
  options = Roles._normalizeOptions(options);

  options = Object.assign(
    {
      anyScope: false,
      queryOptions: {},
    },
    options,
  );

  if (!Array.isArray(roles)) roles = [roles];
  Roles._checkScopeName(options.scope);

  return _getUsersInRoleCursorOnly(roles, options, options.queryOptions);
}

function _getUsersInRoleCursorOnly(roles, options, filter) {
  var selector;

  options = Roles._normalizeOptions(options);

  options = Object.assign(
    {
      anyScope: false,
      onlyScoped: false,
    },
    options,
  );

  // ensure array to simplify code
  if (!Array.isArray(roles)) roles = [roles];

  Roles._checkScopeName(options.scope);

  filter = Object.assign(
    {
      fields: { 'user._id': 1 },
    },
    filter,
  );

  selector = {
    'role._id': { $in: roles },
  };

  if (!options.anyScope) {
    selector.scope = { $in: [options.scope] };

    if (!options.onlyScoped) {
      selector.scope.$in.push(null);
    }
  }

  return Meteor.roleAssignment.find(selector, filter);
}

/** 根据角色获取用户列表,类似分页 */
Api.addRoute('roles/getUsersInRoleOnly', {
  post: function () {
    try {
      return getUsersInRoleOnly({
        roles: this.bodyParams.roles,
        options: this.bodyParams.options,
        queryOptions: this.bodyParams.queryOptions,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/getUsersInNotRole', {
  post: function () {
    try {
      return getUsersInNotRole({
        roles: this.bodyParams.roles,
        options: this.bodyParams.options,
        queryOptions: this.bodyParams.queryOptions,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/getUsersInNotRoleOnly', {
  post: function () {
    try {
      return getUsersInNotRoleOnly({
        roles: this.bodyParams.roles,
        options: this.bodyParams.options,
        queryOptions: this.bodyParams.queryOptions,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/addPermission', {
  post: function () {
    try {
      return addPermission({
        parentName: this.bodyParams.parentName,
        rolesNames: this.bodyParams.rolesNames,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/get', {
  post: function () {
    try {
      return getRoles({
        selector: this.bodyParams.selector,
        options: this.bodyParams.options,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/getWithUser', {
  post: function () {
    try {
      return getRolesByCurrentUser({
        selector: this.bodyParams.selector,
        options: this.bodyParams.options,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/getRolesTreeByCurrentUser', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return getRolesTreeByCurrentUser({
          selector: this.bodyParams.selector,
          options: this.bodyParams.options,
          userId: this.userId,
        });
      } catch (e) {
        return serverError500({
          code: 500,
          message: e.message,
        });
      }
    },
  },
});

/** 添加数据权限的规则 */
Api.addRoute('roles/addRules', {
  post: function () {
    try {
      return addRules({
        roleName: this.bodyParams.roleName,
        rules: this.bodyParams.rules,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

/** 删除数据权限的规则 */
Api.addRoute('roles/removeRules', {
  post: function () {
    try {
      return removeRules({
        roleName: this.bodyParams.roleName,
        rules: this.bodyParams.rules,
      });
    } catch (e) {
      return serverError500({
        code: e instanceof RoleError ? e.code : 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute('roles/addCurrentUserToRolesAndRoleParents', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return addCurrentUserToRolesAndRoleParents({
          roles: this.bodyParams.roles,
          options: this.bodyParams.options,
          userId: this.userId,
        });
      } catch (e) {
        return serverError500({
          code: e instanceof RoleError ? e.code : 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('roles/getRoleWithUser', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return getRoleWithUser({
          scope: this.bodyParams.scope,
          type: this.bodyParams.type,
          userId: this.userId,
        });
      } catch (e) {
        return serverError500({
          code: e instanceof RoleError ? e.code : 500,
          message: e.message,
        });
      }
    },
  },
});

Api.addRoute('roles/getMaxRole', {
  post: {
    authRequired: true,
    action: function () {
      try {
        return getMaxRole({
          roles: this.bodyParams.roles,
        });
      } catch (e) {
        return serverError500({
          code: e instanceof RoleError ? e.code : 500,
          message: e.message,
        });
      }
    },
  },
});
