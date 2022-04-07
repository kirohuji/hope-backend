import Api from "../../api";
import Model, { TagCollection } from './collection'
import _ from 'lodash'
Api.addCollection(TagCollection, {
    path: 'tags',
    routeOptions: { authRequired: false },
});
Api.addRoute('tags/model', {
    get: function () {
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('tags/pagination', {
    post: function () {
        return {
            data: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch(),
            total: Model.find().count()
        }
    }
});
