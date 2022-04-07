import Api from "../../api";
import Model, { TreeCollection } from './collection'
import _ from 'lodash'
Api.addCollection(TreeCollection, {
    path: 'trees',
    routeOptions: { authRequired: false },
});
Api.addRoute('trees/model', {
    get: function () {
        console.log()
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('trees/pagination', {
    post: function () {
        return {
            data: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch(),
            total: Model.find().count()
        }
    }
});
