import { Roles } from 'meteor/alanning:roles';
export const getRolesForUser = (user, options) => {
  let id
  let selector
  let filter
  let roles

  options = Roles._normalizeOptions(options)

  Roles._checkScopeName(options.scope)

  options = Object.assign({
    fullObjects: false,
    onlyAssigned: false,
    anyScope: false,
    onlyScoped: false
  }, options)

  if (user && typeof user === 'object') {
    id = user._id
  } else {
    id = user
  }

  if (!id) return []

  selector = {
    'user._id': id
  }

  filter = {
    fields: { 'inheritedRoles._id': 1 }
  }

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

  roles = Meteor.roleAssignment.find(selector, filter).fetch()

  if (options.fullObjects) {
    return roles
  }

  return [...new Set(roles.reduce((rev, current) => {
    if (current.inheritedRoles) {
      return rev.concat(current.inheritedRoles.map(r => r._id))
    } else if (current.role) {
      rev.push(current.role._id)
    }
    return rev
  }, []))]
},
