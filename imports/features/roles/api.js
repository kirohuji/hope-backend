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
        code: 500,
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
        const _id = this.bodyParams._id || new Mongo.ObjectID()._str;
        Roles._checkRoleName(_id);
        options = Object.assign(
          {
            unlessExists: false,
          },
          {},
        );
        let result = Meteor.roles.upsert(
          {
            ...this.bodyParams,
            _id: _id,
          },
          { $setOnInsert: { children: [] } },
        );
        if (!result.insertedId) {
          if (options.unlessExists) return null;
          throw new Error("角色 '" + _id + "' 已经存在.");
        }
        return Meteor.roles.findOne(
          { _id: _id },
          {
            fields: {
              label: 1,
              value: 1,
              descritpion: 1,
              root: 1,
            },
          },
        );
      } catch (e) {
        return {
          error: e.message,
        };
      }
    },
  },
);

/** 添加父节点 */
Api.addRoute('roles/addRolesToParent', {
  post: function () {
    try {
      Roles.addRolesToParent(
        this.bodyParams.rolesNames,
        this.bodyParams.parentName,
      );
      return true;
    } catch (e) {
      return {
        statusCode: 500,
      };
    }
  },
});

/** 添加父节点 */
Api.addRoute('roles/updateRolesToParent', {
  post: function () {
    try {
      const role = Meteor.roles.findOne({ _id: this.bodyParams.parentName });
      if (role) {
        const currentRolesNames = _.compact(
          Meteor.roles
            .find({
              _id: {
                $in: role?.children.map(item => item._id) || [],
              },
              type: 'permission'
            })
            .map(item => item._id),
        );
        Roles.removeRolesFromParent(
          currentRolesNames,
          this.bodyParams.parentName,
        );
        Roles.addRolesToParent(
          this.bodyParams.rolesNames,
          this.bodyParams.parentName,
        );
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.log(e);
      return {
        statusCode: 500,
      };
    }
  },
});

Api.addRoute('roles/:id', {
  get: function () {
    try {
      const _id = this.urlParams.id;
      return Meteor.roles.findOne({ _id: _id });
    } catch (e) {
      return {
        error: e.message,
      };
    }
  },
  patch: function () {
    try {
      const _id = this.urlParams.id;
      /** 添加 */
      let result = Meteor.roles.update(
        {
          _id: _id,
        },
        {
          $set: _.omit(this.bodyParams, '_id'),
        },
      );
      return Meteor.roles.findOne({ _id: _id });
    } catch (e) {
      return {
        error: e.message,
      };
    }
  },
  delete: function () {
    try {
      Roles.deleteRole(this.urlParams.id);
      return true;
    } catch (e) {
      return {
        statusCode: 500,
      };
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
    return {
      data: Meteor.roles
        .find(
          {
            ...this.bodyParams.selector,
            // type: 'role'
          } || {},
          this.bodyParams.options,
        )
        .fetch(),
      total: Meteor.roles.find().count(),
    };
  },
});

Api.addRoute('roles/renameRole', {
  post: function () {
    try {
      Roles.renameRole(this.bodyParams.oldName, this.bodyParams.newName);
      return true;
    } catch (e) {
      return {
        statusCode: 500,
      };
    }
  },
});

Api.addRoute('roles/changeLeader', {
  post: function () {
    try {
      const role = Meteor.roles.findOne({
        _id: this.bodyParams._id,
      });
      return Meteor.roles.update(
        {
          _id: this.bodyParams._id,
        },
        {
          ...role,
          ...this.bodyParams,
        },
      );
    } catch (e) {
      return {
        statusCode: 500,
      };
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
      Roles.removeUsersFromRoles(
        this.bodyParams.users,
        this.bodyParams.roles,
        this.bodyParams.options,
      );
      // return true;
      // const role = Meteor.roles.findOne({ _id: this.bodyParams.roles });
      // const currentRolesNames = _.compact(
      //   Meteor.roles
      //     .find({
      //       _id: {
      //         $in: Roles._getInheritedRoleNames(role),
      //       },
      //     })
      //     .fetch()
      // );
      // const permissions = currentRolesNames.map(
      //   (item) => item.type == "permission" && item._id
      // );
      // permissions.forEach((permission) => {
      //   const ruleRoles = RuleRole.find({
      //     role_id: permission,
      //   }).fetch();
      //   ruleRoles.forEach((e) => {
      //     const ruleAssignment = RuleAssignment.findOne({
      //       user_id: this.bodyParams.users._id,
      //       role_id: e.role_id,
      //       rule_value: e.rule_value,
      //       router: e.router,
      //     });
      //     ruleAssignment.remove();
      //   });
      // });
      return true;
    } catch (e) {
      return {
        statusCode: 500,
      };
    }
  },
});

Api.addRoute('roles/getInheritedRoleNames', {
  post: function () {
    const scope = ScopeCollection.findOne({ _id: this.bodyParams._id });
    if (scope) {
      const roles = Meteor.roles
        .find({
          type: this.bodyParams.type,
          root: true,
        })
        .fetch();
      return roles;
    }
    const role = Meteor.roles.findOne({ _id: this.bodyParams._id });
    const currentRolesNames = _.compact(
      Meteor.roles
        .find({
          _id: {
            $in: Roles._getInheritedRoleNames(role),
          },
        })
        .fetch(),
    );
    if (this.bodyParams.filter) {
      currentRolesNames = currentRolesNames.map(
        item => item.type == this.bodyParams.filter && item._id,
      );
    }
    return currentRolesNames;
  },
});

function _getInheritedRoleNames(role) {
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
      const scope = ScopeCollection.findOne({ _id: this.bodyParams._id });
      if (scope) {
        const roles = Meteor.roles
          .find({
            type: this.bodyParams.type,
            root: true,
          })
          .fetch();
        return roles;
      }
      const role = Meteor.roles.findOne({ _id: this.bodyParams._id });
      const currentRolesNames = _.compact(
        Meteor.roles
          .find({
            _id: {
              $in: _getInheritedRoleNames(role),
            },
          })
          .fetch(),
      );
      if (this.bodyParams.filter) {
        currentRolesNames = currentRolesNames.map(
          item => item.type == this.bodyParams.filter && item._id,
        );
      }
      console.log('查询成功');
      return currentRolesNames;
    } catch (e) {
      console.log(e);
      return {
        statusCode: 500,
      };
    }
  },
});

Api.addRoute('roles/getChildrenRoleNamesWithUser', {
  post: function () {
    try {
      if (this.bodyParams.query) {
        let regex = this.bodyParams.query;
        let users = ProfilesCollection.find(
          {
            $or: [
              {
                username: {
                  $regex: regex,
                  $options: 'i',
                },
              },
              {
                phoneNumber: {
                  $regex: regex,
                  $options: 'i',
                },
              },
            ],
          },
          {
            fields: {
              _id: 1,
              username: 1,
              realName: 1,
              displayName: 1,
              photoURL: 1,
            },
          },
        ).fetch();
        return users;
      }
      const scope = ScopeCollection.findOne({ _id: this.bodyParams._id });
      if (scope) {
        const roles = Meteor.roles
          .find({
            type: this.bodyParams.type,
            root: true,
          })
          .fetch();
        return roles;
      }
      const role = Meteor.roles.findOne({ _id: this.bodyParams._id });
      const currentRolesNames = _.compact(
        Meteor.roles
          .find({
            _id: {
              $in: role.children.map(item => item._id),
            },
            type: this.bodyParams.type,
          })
          .fetch(),
      );
      if (this.bodyParams.filter) {
        currentRolesNames = currentRolesNames.map(
          item => item.type == this.bodyParams.filter && item._id,
        );
      }
      const leader = ProfilesCollection.findOne(
        {
          _id: role.leader_id,
        },
        {
          fields: {
            _id: 1,
            username: 1,
          },
        },
      );
      let ids = getUserAssignmentsForRoleOnly(role._id, {
        scope: this.bodyParams.scope,
      })
        .fetch()
        .map(a => a.user._id);
      let users = ProfilesCollection.find(
        { _id: { $in: ids } },
        {
          fields: {
            _id: 1,
            username: 1,
            realName: 1,
            displayName: 1,
            photoURL: 1,
          },
        },
      ).fetch();
      return {
        leader,
        users,
        children: currentRolesNames,
      };
    } catch (e) {
      console.log(e);
      return {
        statusCode: 500,
      };
    }
  },
});

Api.addRoute('roles/getChildrenRoleNames', {
  post: function () {
    try {
      const scope = ScopeCollection.findOne({ _id: this.bodyParams._id });
      if (scope) {
        const roles = Meteor.roles
          .find({
            type: this.bodyParams.type,
            root: true,
          })
          .fetch();
        return roles;
      }
      const role = Meteor.roles.findOne({ _id: this.bodyParams._id });
      const currentRolesNames = _.compact(
        Meteor.roles
          .find({
            _id: {
              $in: role.children.map(item => item._id),
            },
          })
          .fetch(),
      );
      // console.log(currentRolesNames)
      if (this.bodyParams.filter) {
        currentRolesNames = currentRolesNames.map(
          item => item.type == this.bodyParams.filter && item._id,
        );
      }
      return currentRolesNames;
    } catch (e) {
      console.log(e);
      return {
        statusCode: 500,
      };
    }
  },
});

Api.addRoute('roles/removeUsersFromRolesAndInheritedRole', {
  post: function () {
    const role = Meteor.roles.findOne({ _id: this.bodyParams.roles });
    try {
      Roles.removeUsersFromRoles(
        this.bodyParams.users,
        [this.bodyParams.roles, ...Roles._getInheritedRoleNames(role)],
        this.bodyParams.options,
      );
      return true;
    } catch (e) {
      return {
        statusCode: 500,
      };
    }
  },
});

Api.addRoute('roles/addUsersToRolesAndRoleParents', {
  post: function () {
    try {
      Roles.addUsersToRoles(
        this.bodyParams.users,
        [
          this.bodyParams.roles,
          ...Roles._getParentRoleNames({
            _id: this.bodyParams.roles,
          }),
        ],
        this.bodyParams.options,
      );
      return true;
    } catch (e) {
      return {
        statusCode: 500,
      };
    }
  },
});

Api.addRoute('roles/addUsersToRoles', {
  post: function () {
    try {
      Roles.addUsersToRoles(
        this.bodyParams.users,
        this.bodyParams.roles,
        this.bodyParams.options,
      );

      const role = Meteor.roles.findOne({ _id: this.bodyParams.roles });
      const currentRolesNames = _.compact(
        Meteor.roles
          .find({
            _id: {
              $in: Roles._getInheritedRoleNames(role),
            },
          })
          .fetch(),
      );
      const permissions = _.compact(
        currentRolesNames.map(item => item.type == 'permission' && item._id),
      );
      permissions.forEach(permission => {
        const ruleRoles = RuleRole.find({
          role_id: permission,
        }).fetch();
        ruleRoles.forEach(e => {
          const ruleAssignment = new RuleAssignment();
          ruleAssignment.set({
            user_id: this.bodyParams.users._id,
            role_id: e.role_id,
            rule_value: e.rule_value,
            router: e.router,
          });
          ruleAssignment.save();
          console.log('ruleRoles', ruleAssignment);
        });
      });
      return true;
    } catch (e) {
      return {
        statusCode: 500,
      };
    }
  },
});

/** 根据角色获取用户列表,类似分页 */
Api.addRoute('roles/getUsersInRole', {
  post: function () {
    try {
      let ids;
      ids = Roles.getUserAssignmentsForRole(
        this.bodyParams.roles,
        this.bodyParams.options,
      )
        .fetch()
        .map(a => a.user._id);
      return {
        data: ProfilesCollection.find(
          { _id: { $in: ids } },
          (this.bodyParams.options && this.bodyParams.options.queryOptions) ||
            this.bodyParams.queryOptions ||
            {},
        ).fetch(),
        total: Meteor.users.find({ _id: { $in: ids } }).count(),
      };
    } catch (e) {
      return {
        statusCode: 500,
      };
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
      let ids;
      ids = getUserAssignmentsForRoleOnly(
        this.bodyParams.roles,
        this.bodyParams.options,
      )
        .fetch()
        .map(a => a.user._id);
      return {
        data: Meteor.users
          .find(
            { _id: { $in: ids } },
            (this.bodyParams.options && this.bodyParams.options.queryOptions) ||
              this.bodyParams.queryOptions ||
              {},
          )
          .fetch()
          .map(item => {
            const profile = item.profile();
            return {
              displayName: profile.displayName || '',
              photoURL: profile.photoURL || '',
              phoneNumber: profile.phoneNumber || '',
              description: profile.about,
              realName: profile.realName,
              ..._.omit(item, 'services'),
            };
          }),
        total: Meteor.users.find({ _id: { $in: ids } }).count(),
      };
    } catch (e) {
      return {
        statusCode: 500,
      };
    }
  },
});

Api.addRoute('roles/getUsersInNotRole', {
  post: function () {
    try {
      let ids;
      ids = Role.getUserAssignmentsForRole(
        this.bodyParams.roles,
        this.bodyParams.options,
      )
        .fetch()
        .map(a => a.user._id);
      return {
        data: Meteor.users
          .find(
            { _id: { $nin: ids } },
            (this.bodyParams.options && this.bodyParams.options.queryOptions) ||
              this.bodyParams.queryOptions ||
              {},
          )
          .fetch()
          .map(item => {
            const profile = item.profile();
            return {
              displayName: profile.displayName || '',
              photoURL: user.photoURL || "",
              phoneNumber: profile.phoneNumber || '',
              description: profile.about,
              ..._.omit(item, 'services'),
            };
          }),
        total: Meteor.users.find({ _id: { $nin: ids } }).count(),
      };
    } catch (e) {
      return {
        statusCode: 500,
      };
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
      let role = Meteor.roles.findOne({
        _id: this.bodyParams.parentName,
      });
      let roles = role.children.map(item => item._id);
      let remove = _.difference(roles, this.bodyParams.rolesNames);
      Roles.removeRolesFromParent(remove, this.bodyParams.parentName);
      let add = _.difference(this.bodyParams.rolesNames, roles);
      Roles.addRolesToParent(add, this.bodyParams.parentName);
      return true;
    } catch (e) {
      return {
        statusCode: 500,
      };
    }
  },
});

Api.addRoute('roles/get', {
  post: function () {
    return Meteor.roles
      .find(
        {
          ...this.bodyParams.selector,
        } || {},
        this.bodyParams.options,
      )
      .fetch()
      .map(item => {
        return {
          ...item,
          count: _.uniqBy(
            getUserAssignmentsForRoleOnly(
              [item._id, ...Roles._getInheritedRoleNames(item)],
              this.bodyParams.selector,
            )
              .fetch()
              .map(item => item.user),
            '_id',
          ).length,
        };
      });
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
    this.bodyParams.rules.forEach(e => {
      const ruleRole = new RuleRole();
      ruleRole.set({
        role_id: this.bodyParams.roleName,
        rule_value: e.rule,
        router: e.route,
      });
      ruleRole.save();
      console.log('保存成功', this.bodyParams.roleName);
      Roles.getUserAssignmentsForRole(this.bodyParams.roleName, {
        anyScope: true,
      })
        .fetch()
        .map(a => {
          const ruleAssignment = new RuleAssignment();
          ruleAssignment.set({
            user_id: a.user._id,
            role_id: this.bodyParams.roleName,
            rule_value: e.rule,
            router: e.route,
          });
          ruleAssignment.save();
        });
    });
    return true;
  },
});

/** 删除数据权限的规则 */
Api.addRoute('roles/removeRules', {
  post: function () {
    this.bodyParams.rules.forEach(e => {
      const ruleRole = RuleRole.findOne({
        role_id: this.bodyParams.roleName,
        rule_value: e.rule_value,
        router: e.router,
      });
      ruleRole.remove();
      Roles.getUserAssignmentsForRole(this.bodyParams.roleName, {
        anyScope: true,
      })
        .fetch()
        .forEach(a => {
          const ruleAssignment = RuleAssignment.findOne({
            user_id: a.user._id,
            role_id: this.bodyParams.roleName,
            rule_value: e.rule,
            router: e.route,
          });
          ruleAssignment.remove();
        });
    });
    return true;
  },
});

Api.addRoute('roles/addCurrentUserToRolesAndRoleParents', {
  post: {
    authRequired: true,
    action: function () {
      try {
        Roles.addUsersToRoles(
          [this.userId],
          [
            this.bodyParams.roles,
            ...Roles._getParentRoleNames({
              _id: this.bodyParams.roles,
            }),
          ],
          this.bodyParams.options,
        );
        console.log('this.bodyParams.roles', this.bodyParams.roles);
        return true;
      } catch (e) {
        console.log(e);
        return {
          statusCode: 500,
        };
      }
    },
  },
});

Api.addRoute('roles/getRoleWithUser', {
  post: {
    authRequired: true,
    action: function () {
      try {
        console.log(this.userId);
        const roles = Roles.getRolesForUser(this.userId, {
          scope: this.bodyParams.scope,
        });
        // console.log(roles)
        if (roles.indexOf('admin') != -1) {
          return Meteor.roles
            .find({
              scope: this.bodyParams.scope,
              type: this.bodyParams.type || 'permission',
            })
            .fetch();
        } else {
          return Meteor.roles
            .find(
              {
                _id: { $in: roles },
                type: this.bodyParams.type || 'permission',
              } || {},
              this.bodyParams.options,
            )
            .fetch();
        }
      } catch (e) {
        console.log(e);
        return {
          statusCode: 500,
        };
      }
    },
  },
});

Api.addRoute('roles/getMaxRole', {
  post: {
    authRequired: true,
    action: function () {
      try {
        let roles = this.bodyParams.roles;
        if (roles && roles.length) {
          let maxRole = roles[0];
          for (let i = 0; i < roles.length; i++) {
            if (!Roles.isParentOf(maxRole, roles[i])) {
              maxRole = roles[i];
            }
          }
          return Meteor.roles.findOne({ _id: maxRole });
        } else {
          return {};
        }
      } catch (e) {
        console.log(e);
        return {
          statusCode: 500,
        };
      }
    },
  },
});
