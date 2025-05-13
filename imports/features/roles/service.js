import { ProfilesCollection } from "meteor/socialize:user-profile";
import { ScopeCollection } from "../scopes/collection";
import { Roles } from "meteor/alanning:roles";
import _ from "lodash";
import { RuleRole, RuleAssignment } from './collection';

// Error handling utilities
export class RoleError extends Error {
  constructor(message, code = 500) {
    super(message);
    this.name = 'RoleError';
    this.code = code;
  }
}

function getUserAssignmentsForRoleOnly(roles, options) {
  try {
    options = Roles._normalizeOptions(options);

    options = Object.assign(
      {
        anyScope: false,
        queryOptions: {},
      },
      options
    );

    if (!Array.isArray(roles)) roles = [roles];
    Roles._checkScopeName(options.scope);

    return _getUsersInRoleCursorOnly(roles, options, options.queryOptions);
  } catch (error) {
    throw new RoleError(`Failed to get user assignments: ${error.message}`);
  }
}

function _getUsersInRoleCursorOnly(roles, options, filter) {
  try {
    var selector;

    options = Roles._normalizeOptions(options);

    options = Object.assign(
      {
        anyScope: false,
        onlyScoped: false,
      },
      options
    );

    if (!Array.isArray(roles)) roles = [roles];
    Roles._checkScopeName(options.scope);

    filter = Object.assign(
      {
        fields: { "user._id": 1 },
      },
      filter
    );

    selector = {
      "role._id": { $in: roles },
    };

    if (!options.anyScope) {
      selector.scope = { $in: [options.scope] };

      if (!options.onlyScoped) {
        selector.scope.$in.push(null);
      }
    }

    return Meteor.roleAssignment.find(selector, filter);
  } catch (error) {
    throw new RoleError(`Failed to get users in role cursor: ${error.message}`);
  }
}

function getTreeByAll(data) {
  const list = data.map((item) => ({
    name: item.label,
    group: item.scope,
    role: item.value,
    ...item,
    checked: false,
  }));
  const root = list
    .filter((item) => item.root)
    .map((item) => ({
      name: item.label,
      group: item.scope,
      role: item.value,
      ...item,
      checked: false,
    }));
  serverArray(root, null, list);
  return root;
}

function serverArray(list, parent, data) {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < list.length; i++) {
    if (list[i] && list[i].value) {
      if (list[i] && list[i].children && _.compact(list[i].children).length) {
        serverArray(
          list[i].children.map((item) => _.find(data, ["_id", item._id])),
          list[i],
          data
        );
      } else {
        list[i].children = undefined;
      }
      if (parent && parent.children) {
        if (list[i]) {
          parent.children[i] = {
            ...list[i],
            checked: false,
          };
        } else {
          delete parent.children[i];
        }
      }
    } else {
      delete parent.children[i];
    }
  }
  if (parent && parent.children && _.compact(parent.children).length === 0) {
    delete parent.children;
  }
}

function getTree(data) {
  const root = data
    .filter((item) => item.isScope)
    .map((item) => ({
      ...item,
      children: data.filter((d) => d.root && !d.isScope),
    }));
  serverArray(root, null, data);
  return root;
}

function getRolesForUser(user, options) {
  let id;

  options = Roles._normalizeOptions(options);

  Roles._checkScopeName(options.scope);

  options = Object.assign(
    {
      fullObjects: false,
      onlyAssigned: false,
      anyScope: false,
      onlyScoped: false,
      isRole: false,
      type: false,
    },
    options
  );

  if (user && typeof user === "object") {
    id = user._id;
  } else {
    id = user;
  }

  if (!id) return [];

  // const selector = { 'user._id': id }
  const selector = {};
  const filter = { fields: { "inheritedRoles._id": 1 } };

  if (!options.anyScope) {
    selector.scope = { $in: [options.scope] };

    if (!options.onlyScoped) {
      selector.scope.$in.push(null);
    }
  }

  if (options.onlyAssigned) {
    delete filter.fields["inheritedRoles._id"];
    filter.fields["role._id"] = 1;
  }

  if (options.fullObjects) {
    delete filter.fields;
  }

  const roles = Meteor.roleAssignment.find(selector, filter).fetch();

  if (options.fullObjects) {
    return roles;
  }

  let roleSet = [
    ...new Set(
      roles.reduce((rev, current) => {
        if (current.inheritedRoles) {
          return rev.concat(current.inheritedRoles.map((r) => r._id));
        } else if (current.role) {
          rev.push(current.role._id);
        }
        return rev;
      }, [])
    ),
  ];
  if (options.isRole) {
    if (options.type) {
      return Meteor.roles
        .find(
          { _id: { $in: roleSet }, type: options.type },
          {
            fields: {
              label: 1,
              value: 1,
              descritpion: 1,
              root: 1,
              type: 1,
              children: 1,
              leader_id: 1,
            },
          }
        )
        .fetch();
    } else {
      return Meteor.roles
        .find(
          { _id: { $in: roleSet } },
          {
            fields: {
              label: 1,
              value: 1,
              descritpion: 1,
              root: 1,
              type: 1,
              children: 1,
              leader_id: 1,
            },
          }
        )
        .fetch();
    }
  } else {
    return roleSet;
  }
}

function getItemInfo({ scope, item }) {
  const leader = ProfilesCollection.findOne(
    {
      _id: item.leader_id,
    },
    {
      fields: {
        _id: 1,
        username: 1,
        displayName: 1,
        realName: 1,
        photoURL: 1,
      },
    }
  );
  let ids = [];
  if (scope) {
    ids = getUserAssignmentsForRoleOnly(item._id, { scope })
      .fetch()
      .map((a) => a.user._id);
  } else {
    ids = getUserAssignmentsForRoleOnly(item._id, { anyScope: true })
      .fetch()
      .map((a) => a.user._id);
  }
  let users = ProfilesCollection.find(
    { _id: { $in: ids } },
    {
      fields: {
        _id: 1,
        username: 1,
      },
    }
  ).count();
  return {
    ...item,
    count: users,
    leader: leader || {},
  };
}

function getTreeNoRoot(data) {
  let root = data;
  const tree = [];
  function serverArrayNoRoot(list, parent) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < list.length; i++) {
      const item = _.find(data, ["_id", list[i]._id]);
      if (item && item.children) {
        if (item.children.length) {
          serverArrayNoRoot(item.children, item);
        } else {
          delete item.children;
        }
      }
      if (parent && parent.children) {
        if (item) {
          parent.children[i] = {
            ...item,
            parent: parent._id,
          };
          root = root.filter((r) => r._id !== item._id);
        } else {
          delete parent.children[i];
        }
      }
    }
    return tree;
  }
  serverArrayNoRoot(root, null);
  return root;
}

// 获取角色列表
export function getRolesByCurrentUser({ selector, options }) {
  try {
    if (!selector) {
      throw new RoleError('Selector is required', 400);
    }

    let roles = Meteor.roles.find({ ...selector }, options).fetch();
    let rolesWithUser = roles.map((item) => {
      const leader = ProfilesCollection.findOne(
        {
          _id: item.leader_id,
        },
        {
          fields: {
            _id: 1,
            username: 1,
          },
        }
      );
      let ids = getUserAssignmentsForRoleOnly(item._id, { scope: selector.scope })
        .fetch()
        .map((a) => a.user._id);
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
        }
      ).fetch();
      return {
        ...item,
        users: users,
        leader: leader || {},
      };
    });
    return getTreeByAll(rolesWithUser);
  } catch (error) {
    throw new RoleError(`Failed to get roles by current user: ${error.message}`);
  }
}

// 获取角色列表(树形结构)
export function getRolesTreeByCurrentUser({ selector, options, userId }) {
  try {
    if (!selector || !userId) {
      throw new RoleError('Selector and userId are required', 400);
    }

    if (selector.scope) {
      let scope = ScopeCollection.findOne(
        { _id: selector.scope },
        {
          fields: {
            value: 1,
            label: 1,
            descritpion: 1,
          },
        }
      );
      if (!scope) {
        throw new RoleError("不存在的组织码,请重试!", 404);
      }
      const currentScope = {
        ...scope,
        root: true,
        role: scope.value,
        scope: scope._id,
        isScope: true,
        children: [],
      };

      const roles = Meteor.roles
        .find(
          { type: selector.type, scope: scope._id },
          {
            fields: {
              label: 1,
              value: 1,
              descritpion: 1,
              root: 1,
              type: 1,
              children: 1,
              leader_id: 1,
            },
          }
        )
        .fetch();

      let rolesWithUser = roles.map((item) =>
        getItemInfo({ scope: selector.scope, item })
      );
      rolesWithUser.push(currentScope);
      let tree = getTree(rolesWithUser);
      return tree;
    } else {
      const roles = getRolesForUser(userId, {
        anyScope: true,
        isRole: true,
        type: selector.type,
      });
      let rolesWithUser = roles.map((item) =>
        getItemInfo({ scope: selector.scope, item })
      );
      let tree = getTree(rolesWithUser);
      return tree;
    }
  } catch (error) {
    throw new RoleError(`Failed to get roles tree: ${error.message}`);
  }
}

export function permissionTree({ selector, options }) {
  try {
    if (!selector) {
      throw new RoleError('Selector is required', 400);
    }

    let permissions = Meteor.roles
      .find(
        {
          ...selector,
          type: "permission",
        } || {},
        options
      )
      .fetch();
    let tree = getTreeNoRoot(permissions);
    return tree;
  } catch (error) {
    throw new RoleError(`Failed to get permission tree: ${error.message}`);
  }
}

export function getUsersInNotRoleOnly({ roles, options, queryOptions }) {
  try {
    if (!roles) {
      throw new RoleError('Roles are required', 400);
    }

    let ids = getUserAssignmentsForRoleOnly(roles, options)
      .fetch()
      .map((a) => a.user._id);
    let users = ProfilesCollection.find(
      {
        _id: { $nin: ids },
        realName: queryOptions?.realName,
        scope: options?.scope,
      },
      {
        limit: 50,
      }
    );

    return {
      data: _.compact(
        users.map((user) => {
          if (user) {
            return {
              _id: user._id,
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              phoneNumber: user.phoneNumber || "",
              description: user.about,
              realName: user.realName,
            };
          }
        })
      ),
      total: users.count(),
    };
  } catch (error) {
    throw new RoleError(`Failed to get users not in role: ${error.message}`);
  }
}

// Business logic functions
export function createRole({ _id, bodyParams }) {
  try {
    if (!_id) {
      _id = new Mongo.ObjectID()._str;
    }
    Roles._checkRoleName(_id);
    const options = Object.assign(
      {
        unlessExists: false,
      },
      {},
    );
    let result = Meteor.roles.upsert(
      {
        ...bodyParams,
        _id: _id,
      },
      { $setOnInsert: { children: [] } },
    );
    if (!result.insertedId) {
      if (options.unlessExists) return null;
      throw new RoleError("角色 '" + _id + "' 已经存在.", 400);
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
  } catch (error) {
    throw new RoleError(`Failed to create role: ${error.message}`);
  }
}

export function addRolesToParent({ rolesNames, parentName }) {
  try {
    if (!rolesNames || !parentName) {
      throw new RoleError('rolesNames and parentName are required', 400);
    }
    Roles.addRolesToParent(rolesNames, parentName);
    return true;
  } catch (error) {
    throw new RoleError(`Failed to add roles to parent: ${error.message}`);
  }
}

export function updateRolesToParent({ rolesNames, parentName }) {
  try {
    if (!rolesNames || !parentName) {
      throw new RoleError('rolesNames and parentName are required', 400);
    }
    const role = Meteor.roles.findOne({ _id: parentName });
    if (!role) {
      throw new RoleError('Parent role not found', 404);
    }
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
    Roles.removeRolesFromParent(currentRolesNames, parentName);
    Roles.addRolesToParent(rolesNames, parentName);
    return true;
  } catch (error) {
    throw new RoleError(`Failed to update roles to parent: ${error.message}`);
  }
}

export function getRoleById(id) {
  try {
    if (!id) {
      throw new RoleError('Role ID is required', 400);
    }
    const role = Meteor.roles.findOne({ _id: id });
    if (!role) {
      throw new RoleError('Role not found', 404);
    }
    return role;
  } catch (error) {
    throw new RoleError(`Failed to get role: ${error.message}`);
  }
}

export function updateRole({ id, bodyParams }) {
  try {
    if (!id) {
      throw new RoleError('Role ID is required', 400);
    }
    const role = Meteor.roles.findOne({ _id: id });
    if (!role) {
      throw new RoleError('Role not found', 404);
    }
    let result = Meteor.roles.update(
      { _id: id },
      { $set: _.omit(bodyParams, '_id') }
    );
    return Meteor.roles.findOne({ _id: id });
  } catch (error) {
    throw new RoleError(`Failed to update role: ${error.message}`);
  }
}

export function deleteRoleById(id) {
  try {
    if (!id) {
      throw new RoleError('Role ID is required', 400);
    }
    const role = Meteor.roles.findOne({ _id: id });
    if (!role) {
      throw new RoleError('Role not found', 404);
    }
    Roles.deleteRole(id);
    return true;
  } catch (error) {
    throw new RoleError(`Failed to delete role: ${error.message}`);
  }
}

export function getRolesPagination({ selector, options }) {
  try {
    return {
      data: Meteor.roles
        .find(selector || {}, options)
        .fetch(),
      total: Meteor.roles.find().count(),
    };
  } catch (error) {
    throw new RoleError(`Failed to get roles pagination: ${error.message}`);
  }
}

export function renameRole({ oldName, newName }) {
  try {
    if (!oldName || !newName) {
      throw new RoleError('oldName and newName are required', 400);
    }
    Roles.renameRole(oldName, newName);
    return true;
  } catch (error) {
    throw new RoleError(`Failed to rename role: ${error.message}`);
  }
}

export function changeLeader({ _id, bodyParams }) {
  try {
    if (!_id) {
      throw new RoleError('Role ID is required', 400);
    }
    const role = Meteor.roles.findOne({ _id: _id });
    if (!role) {
      throw new RoleError('Role not found', 404);
    }
    return Meteor.roles.update(
      { _id: _id },
      {
        ...role,
        ...bodyParams,
      }
    );
  } catch (error) {
    throw new RoleError(`Failed to change leader: ${error.message}`);
  }
}

export function removeUsersFromRoles({ users, roles, options }) {
  try {
    if (!users || !roles) {
      throw new RoleError('users and roles are required', 400);
    }
    Roles.removeUsersFromRoles(users, roles, options);
    return true;
  } catch (error) {
    throw new RoleError(`Failed to remove users from roles: ${error.message}`);
  }
}

export function getInheritedRoleNames({ _id, type, filter }) {
  try {
    if (!_id) {
      throw new RoleError('ID is required', 400);
    }
    const scope = ScopeCollection.findOne({ _id: _id });
    if (scope) {
      return Meteor.roles
        .find({
          type: type,
          root: true,
        })
        .fetch();
    }
    const role = Meteor.roles.findOne({ _id: _id });
    if (!role) {
      throw new RoleError('Role not found', 404);
    }
    let currentRolesNames = _.compact(
      Meteor.roles
        .find({
          _id: {
            $in: Roles._getInheritedRoleNames(role),
          },
        })
        .fetch(),
    );
    if (filter) {
      currentRolesNames = currentRolesNames.map(
        item => item.type == filter && item._id,
      );
    }
    return currentRolesNames;
  } catch (error) {
    throw new RoleError(`Failed to get inherited role names: ${error.message}`);
  }
}

export function addRules({ roleName, rules }) {
  try {
    if (!roleName || !rules) {
      throw new RoleError('roleName and rules are required', 400);
    }
    rules.forEach(e => {
      const ruleRole = new RuleRole();
      ruleRole.set({
        role_id: roleName,
        rule_value: e.rule,
        router: e.route,
      });
      ruleRole.save();
      
      Roles.getUserAssignmentsForRole(roleName, {
        anyScope: true,
      })
        .fetch()
        .map(a => {
          const ruleAssignment = new RuleAssignment();
          ruleAssignment.set({
            user_id: a.user._id,
            role_id: roleName,
            rule_value: e.rule,
            router: e.route,
          });
          ruleAssignment.save();
        });
    });
    return true;
  } catch (error) {
    throw new RoleError(`Failed to add rules: ${error.message}`);
  }
}

export function removeRules({ roleName, rules }) {
  try {
    if (!roleName || !rules) {
      throw new RoleError('roleName and rules are required', 400);
    }
    rules.forEach(e => {
      const ruleRole = RuleRole.findOne({
        role_id: roleName,
        rule_value: e.rule_value,
        router: e.router,
      });
      if (ruleRole) {
        ruleRole.remove();
      }
      
      Roles.getUserAssignmentsForRole(roleName, {
        anyScope: true,
      })
        .fetch()
        .forEach(a => {
          const ruleAssignment = RuleAssignment.findOne({
            user_id: a.user._id,
            role_id: roleName,
            rule_value: e.rule,
            router: e.route,
          });
          if (ruleAssignment) {
            ruleAssignment.remove();
          }
        });
    });
    return true;
  } catch (error) {
    throw new RoleError(`Failed to remove rules: ${error.message}`);
  }
}

export function getChildrenRoleNames({ _id, type, filter }) {
  try {
    if (!_id) {
      throw new RoleError('ID is required', 400);
    }

    const scope = ScopeCollection.findOne({ _id: _id });
    if (scope) {
      return Meteor.roles
        .find({
          type: type,
          root: true,
        })
        .fetch();
    }

    const role = Meteor.roles.findOne({ _id: _id });
    if (!role) {
      throw new RoleError('Role not found', 404);
    }

    let currentRolesNames = _.compact(
      Meteor.roles
        .find({
          _id: {
            $in: role.children.map(item => item._id),
          },
        })
        .fetch(),
    );

    if (filter) {
      currentRolesNames = currentRolesNames.map(
        item => item.type == filter && item._id,
      );
    }

    return currentRolesNames;
  } catch (error) {
    throw new RoleError(`Failed to get children role names: ${error.message}`);
  }
}

export function getChildrenRoleNamesWithUser({ _id, type, filter, query, scope }) {
  try {
    if (!_id) {
      throw new RoleError('ID is required', 400);
    }

    if (query) {
      let regex = query;
      return ProfilesCollection.find(
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
    }

    const scopeDoc = ScopeCollection.findOne({ _id: _id });
    if (scopeDoc) {
      return Meteor.roles
        .find({
          type: type,
          root: true,
          scope: _id
        })
        .fetch();
    }

    const role = Meteor.roles.findOne({ _id: _id });
    if (!role) {
      throw new RoleError('Role not found', 404);
    }

    let currentRolesNames = _.compact(
      Meteor.roles
        .find({
          _id: {
            $in: role.children.map(item => item._id),
          },
          type: type,
        })
        .fetch(),
    );

    if (filter) {
      currentRolesNames = currentRolesNames.map(
        item => item.type == filter && item._id,
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
      scope: scope,
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
  } catch (error) {
    throw new RoleError(`Failed to get children role names with user: ${error.message}`);
  }
}

export function getInheritedRoleNamesOnly({ _id, type, filter }) {
  try {
    if (!_id) {
      throw new RoleError('ID is required', 400);
    }

    const scope = ScopeCollection.findOne({ _id: _id });
    if (scope) {
      return Meteor.roles
        .find({
          type: type,
          root: true,
        })
        .fetch();
    }

    const role = Meteor.roles.findOne({ _id: _id });
    if (!role) {
      throw new RoleError('Role not found', 404);
    }

    let currentRolesNames = _.compact(
      Meteor.roles
        .find({
          _id: {
            $in: _getInheritedRoleNames(role),
          },
        })
        .fetch(),
    );

    if (filter) {
      currentRolesNames = currentRolesNames.map(
        item => item.type == filter && item._id,
      );
    }

    return currentRolesNames;
  } catch (error) {
    throw new RoleError(`Failed to get inherited role names only: ${error.message}`);
  }
}

export function removeUsersFromRolesAndInheritedRole({ users, roles, options }) {
  try {
    if (!users || !roles) {
      throw new RoleError('users and roles are required', 400);
    }

    const role = Meteor.roles.findOne({ _id: roles });
    if (!role) {
      throw new RoleError('Role not found', 404);
    }

    Roles.removeUsersFromRoles(
      users,
      [roles, ...Roles._getInheritedRoleNames(role)],
      options,
    );
    return true;
  } catch (error) {
    throw new RoleError(`Failed to remove users from roles and inherited role: ${error.message}`);
  }
}

export function addUsersToRolesAndRoleParents({ users, roles, options }) {
  try {
    if (!users || !roles) {
      throw new RoleError('users and roles are required', 400);
    }

    Roles.addUsersToRoles(
      users,
      [
        roles,
        ...Roles._getParentRoleNames({
          _id: roles,
        }),
      ],
      options,
    );
    return true;
  } catch (error) {
    throw new RoleError(`Failed to add users to roles and role parents: ${error.message}`);
  }
}

export function addUsersToRoles({ users, roles, options }) {
  try {
    if (!users || !roles) {
      throw new RoleError('users and roles are required', 400);
    }

    Roles.addUsersToRoles(users, roles, options);

    const role = Meteor.roles.findOne({ _id: roles });
    if (!role) {
      throw new RoleError('Role not found', 404);
    }

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
          user_id: users._id,
          role_id: e.role_id,
          rule_value: e.rule_value,
          router: e.router,
        });
        ruleAssignment.save();
      });
    });
    return true;
  } catch (error) {
    throw new RoleError(`Failed to add users to roles: ${error.message}`);
  }
}

export function getUsersInRole({ roles, options, queryOptions }) {
  try {
    if (!roles) {
      throw new RoleError('roles are required', 400);
    }

    let ids = Roles.getUserAssignmentsForRole(roles, options)
      .fetch()
      .map(a => a.user._id);

    return {
      data: ProfilesCollection.find(
        { _id: { $in: ids } },
        (options && options.queryOptions) || queryOptions || {},
      ).fetch(),
      total: Meteor.users.find({ _id: { $in: ids } }).count(),
    };
  } catch (error) {
    throw new RoleError(`Failed to get users in role: ${error.message}`);
  }
}

export function getUsersInRoleOnly({ roles, options, queryOptions }) {
  try {
    if (!roles) {
      throw new RoleError('roles are required', 400);
    }

    let ids = getUserAssignmentsForRoleOnly(roles, options)
      .fetch()
      .map(a => a.user._id);

    return {
      data: Meteor.users
        .find(
          { _id: { $in: ids } },
          (options && options.queryOptions) || queryOptions || {},
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
  } catch (error) {
    throw new RoleError(`Failed to get users in role only: ${error.message}`);
  }
}

export function getUsersInNotRole({ roles, options, queryOptions }) {
  try {
    if (!roles) {
      throw new RoleError('roles are required', 400);
    }

    let ids = Role.getUserAssignmentsForRole(roles, options)
      .fetch()
      .map(a => a.user._id);

    return {
      data: Meteor.users
        .find(
          { _id: { $nin: ids } },
          (options && options.queryOptions) || queryOptions || {},
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
  } catch (error) {
    throw new RoleError(`Failed to get users not in role: ${error.message}`);
  }
}

export function addPermission({ parentName, rolesNames }) {
  try {
    if (!parentName || !rolesNames) {
      throw new RoleError('parentName and rolesNames are required', 400);
    }

    let role = Meteor.roles.findOne({
      _id: parentName,
    });
    if (!role) {
      throw new RoleError('Parent role not found', 404);
    }

    let roles = role.children.map(item => item._id);
    let remove = _.difference(roles, rolesNames);
    Roles.removeRolesFromParent(remove, parentName);
    let add = _.difference(rolesNames, roles);
    Roles.addRolesToParent(add, parentName);
    return true;
  } catch (error) {
    throw new RoleError(`Failed to add permission: ${error.message}`);
  }
}

export function getRoles({ selector, options }) {
  try {
    return Meteor.roles
      .find(selector || {}, options)
      .fetch()
      .map(item => {
        return {
          ...item,
          count: _.uniqBy(
            getUserAssignmentsForRoleOnly(
              [item._id, ...Roles._getInheritedRoleNames(item)],
              selector,
            )
              .fetch()
              .map(item => item.user),
            '_id',
          ).length,
        };
      });
  } catch (error) {
    throw new RoleError(`Failed to get roles: ${error.message}`);
  }
}

export function addCurrentUserToRolesAndRoleParents({ roles, options, userId }) {
  try {
    if (!roles || !userId) {
      throw new RoleError('roles and userId are required', 400);
    }

    Roles.addUsersToRoles(
      [userId],
      [
        roles,
        ...Roles._getParentRoleNames({
          _id: roles,
        }),
      ],
      options,
    );
    return true;
  } catch (error) {
    throw new RoleError(`Failed to add current user to roles and role parents: ${error.message}`);
  }
}

export function getRoleWithUser({ scope, type, userId }) {
  try {
    if (!userId) {
      throw new RoleError('userId is required', 400);
    }

    const roles = Roles.getRolesForUser(userId, {
      scope: scope,
    });

    if (roles.indexOf('admin') != -1) {
      return Meteor.roles
        .find({
          scope: scope,
          type: type || 'permission',
        })
        .fetch();
    } else {
      return Meteor.roles
        .find(
          {
            _id: { $in: roles },
            type: type || 'permission',
          } || {},
          options,
        )
        .fetch();
    }
  } catch (error) {
    throw new RoleError(`Failed to get role with user: ${error.message}`);
  }
}

export function getMaxRole({ roles }) {
  try {
    if (!roles || !roles.length) {
      return {};
    }

    let maxRole = roles[0];
    for (let i = 0; i < roles.length; i++) {
      if (!Roles.isParentOf(maxRole, roles[i])) {
        maxRole = roles[i];
      }
    }
    return Meteor.roles.findOne({ _id: maxRole });
  } catch (error) {
    throw new RoleError(`Failed to get max role: ${error.message}`);
  }
}
