import './users'
import './profiles'
import './models'
import './tags'
import './trees'
import './roles'
import './scopes'
import './friendships'
import './messaging'
import './dictionaries'
import './routes'
import './questionnaires'
import './rules'
import { PermissionController } from '../api'
import controll from '../gateway'
PermissionController.addRoute('*/*', { authRequired: true }, {
    get: controll,
    post: controll,
});