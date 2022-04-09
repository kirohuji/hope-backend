import Api from "../../api";
import Model, { ScopeCollection } from './collection'
import _ from 'lodash'
Api.addCollection(ScopeCollection, {
    path: 'scopes',
    routeOptions: { authRequired: false },
});
Api.addRoute('scopes/model', {
    get: function () {
        console.log()
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('scopes/pagination', {
    post: function () {
        return {
            data: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch(),
            total: Model.find().count()
        }
    }
});
