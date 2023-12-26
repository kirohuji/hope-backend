
import { ProfilesCollection } from 'meteor/socialize:user-profile';
import { ScopeCollection } from '../scopes/collection'
import { Roles } from 'meteor/alanning:roles';
import _ from 'lodash';

function getUserAssignmentsForRoleOnly(roles, options) {
  options = Roles._normalizeOptions(options)

  options = Object.assign({
    anyScope: false,
    queryOptions: {}
  }, options)

  if (!Array.isArray(roles)) roles = [roles]
  Roles._checkScopeName(options.scope)

  return _getUsersInRoleCursorOnly(roles, options, options.queryOptions)
}

function _getUsersInRoleCursorOnly(roles, options, filter) {
  var selector

  options = Roles._normalizeOptions(options)

  options = Object.assign({
    anyScope: false,
    onlyScoped: false
  }, options)

  // ensure array to simplify code
  if (!Array.isArray(roles)) roles = [roles]

  Roles._checkScopeName(options.scope)

  filter = Object.assign({
    fields: { 'user._id': 1 }
  }, filter)

  selector = {
    'role._id': { $in: roles }
  }

  if (!options.anyScope) {
    selector.scope = { $in: [options.scope] }

    if (!options.onlyScoped) {
      selector.scope.$in.push(null)
    }
  }

  return Meteor.roleAssignment.find(selector, filter)
}

function getTreeByAll(data) {
  const list = data.map(item => ({
    name: item.label,
    group: item.scope,
    role: item.value,
    ...item
  }))
  const root = list.filter((item) => item.root).map(item => ({
    name: item.label,
    group: item.scope,
    role: item.value,
    ...item,
  }))
  serverArray(root, null, list);
  return root;
}

function serverArray(list, parent, data) {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < list.length; i++) {
    if (list[i] && list[i].value) {
      if (list[i] && list[i].children && _.compact(list[i].children).length) {
        serverArray(list[i].children.map(item => _.find(data, ["_id", item._id])), list[i], data);
      } else {
        list[i].children = undefined;
      }
      if (parent && parent.children) {
        if (list[i]) {
          parent.children[i] = {
            ...list[i],
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
    delete parent.children
  }
}

function getTree(data) {
  const root = data.filter((item) => item.isScope).map(item => ({
    ...item,
    children: data.filter(d => d.root && !d.isScope)
  }))
  serverArray(root, null, data);
  return root;
}

function getRolesForUser(user, options) {
  let id

  options = Roles._normalizeOptions(options)

  Roles._checkScopeName(options.scope)

  options = Object.assign({
    fullObjects: false,
    onlyAssigned: false,
    anyScope: false,
    onlyScoped: false,
    isRole: false,
    type: false,
  }, options)

  if (user && typeof user === 'object') {
    id = user._id
  } else {
    id = user
  }

  if (!id) return []

  const selector = { 'user._id': id }
  const filter = { fields: { 'inheritedRoles._id': 1 } }

  if (!options.anyScope) {
    selector.scope = { $in: [options.scope] }

    if (!options.onlyScoped) {
      selector.scope.$in.push(null)
    }
  }

  if (options.onlyAssigned) {
    delete filter.fields['inheritedRoles._id']
    filter.fields['role._id'] = 1
  }

  if (options.fullObjects) {
    delete filter.fields
  }

  const roles = Meteor.roleAssignment.find(selector, filter).fetch()

  if (options.fullObjects) {
    return roles
  }

  let roleSet = [...new Set(roles.reduce((rev, current) => {
    if (current.inheritedRoles) {
      return rev.concat(current.inheritedRoles.map(r => r._id))
    } else if (current.role) {
      rev.push(current.role._id)
    }
    return rev
  }, []))]
  if (options.isRole) {
    if (options.type) {
      return Meteor.roles.find({ _id: { $in: roleSet }, type: options.type },
        {
          fields: {
            label: 1,
            value: 1,
            descritpion: 1,
            root: 1,
            type: 1,
            children: 1,
            leader_id: 1,
          }
        }).fetch()
    } else {
      return Meteor.roles.find({ _id: { $in: roleSet } },
        {
          fields: {
            label: 1,
            value: 1,
            descritpion: 1,
            root: 1,
            type: 1,
            children: 1,
            leader_id: 1
          }
        }).fetch()
    }
  } else {
    return roleSet
  }

}

function getItemInfo({
  scope,
  item
}) {
  const leader = ProfilesCollection.findOne({
    _id: item.leader_id
  }, {
    fields: {
      _id: 1,
      username: 1
    }
  })
  let ids = []
  if (scope) {
    ids = getUserAssignmentsForRoleOnly(item._id, { scope }).fetch().map(a => a.user._id)
  } else {
    ids = getUserAssignmentsForRoleOnly(item._id, { anyScope: true }).fetch().map(a => a.user._id)
  }
  let users = ProfilesCollection.find({ _id: { $in: ids } }, {
    fields: {
      _id: 1,
      username: 1
    }
  }).count();
  return {
    ...item,
    count: users,
    leader: leader || {},
  }
}


function getTreeNoRoot(data) {
  let root = data
  const tree = [];
  function serverArrayNoRoot(list, parent) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < list.length; i++) {
      const item = _.find(data, ['_id', list[i]._id]);
      if (item && item.children) {
        if (item.children.length) {
          serverArrayNoRoot(item.children, item);
        } else {
          delete item.children;
        }
      }
      if (parent && parent.children) {
        if (item) {
          parent.children[i] = item;
          root = root.filter((r) => r._id !== item._id)
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
export function getRolesByCurrentUser({
  selector,
  options,
}) {
  let roles = Meteor.roles.find({ ...selector }, options).fetch();
  let rolesWithUser = roles.map(item => {
    const leader = ProfilesCollection.findOne({
      _id: item.leader_id
    }, {
      fields: {
        _id: 1,
        username: 1
      }
    })
    let ids = getUserAssignmentsForRoleOnly(item._id, { scope: selector.scope }).fetch().map(a => a.user._id)
    let users = ProfilesCollection.find({ _id: { $in: ids } }).fetch()
    return {
      ...item,
      users: users,
      leader: leader || {},
    }
  })
  return getTreeByAll(rolesWithUser)
}

// 获取角色列表(树形结构)
export function getRolesTreeByCurrentUser({
  selector,
  options,
  userId
}) {
  if (selector.scope) {
    let scope = ScopeCollection.findOne({ _id: selector.scope },
      {
        fields: {
          value: 1,
          label: 1,
          descritpion: 1,
        }
      })
    if (!scope) {
      throw new Error('不存在的组织码,请重试!')
    }
    const currentScope = {
      ...scope,
      root: true,
      role: scope.value,
      scope: scope._id,
      isScope: true,
      children: [],
    }
    const roles = getRolesForUser(userId, {
      scope: selector.scope,
      isRole: true,
      type: selector.type
    });
    let rolesWithUser = roles.map(item => getItemInfo({ scope: selector.scope, item }))
    rolesWithUser.push(currentScope);
    let tree = getTree(rolesWithUser)
    return tree;
  } else {
    console.log('s')
    const roles = getRolesForUser(userId, {
      anyScope: true,
      isRole: true,
      type: selector.type
    });
    let rolesWithUser = roles.map(item => getItemInfo({ scope: selector.scope, item }))
    console.log('rolesWithUser', roles)
    let tree = getTree(rolesWithUser)
    return tree;
  }
}

export function permissionTree({
  selector,
  options
}) {
  let permissions = Meteor.roles
    .find({
      ...selector,
      type: 'permission'
    } || {}, options)
    .fetch()
  // console.log('permissions',permissions)
  let tree = getTreeNoRoot(permissions)
  return tree;
}

export function getUsersInNotRoleOnly({
  roles,
  options,
  queryOptions
}) {
  let ids
  ids = getUserAssignmentsForRoleOnly(roles, options).fetch().map(a => a.user._id);
  let users = Meteor.users.find(
    { _id: { $nin: ids } },
  )
    // ((options && options.queryOptions) || queryOptions) || {})
  return {
    data: _.compact(users.map(user=> {
      if(user) {
        const profile = user.profile();
        if(profile){
          return {
            displayName: profile.displayName || '',
            avatarUrl: profile.photoURL || '',
            phoneNumber: profile.phoneNumber || '',
            description: profile.about,
            // ...profile,
            ..._.omit(user, 'services'),
          }
        }
      }
    })),
    total: users.count(),
  }
}