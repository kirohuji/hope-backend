import Api from "../../api";
import Model, { ModelCollection } from './collection'
import _ from 'lodash'
Api.addCollection(ModelCollection, {
    path: 'models',
    routeOptions: { authRequired: false },
});
Api.addRoute('models/model', {
    get: function () {
        console.log()
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('models/pagination', {
    post: function () {
        return {
            data: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch(),
            total: Model.find().count()
        }
    }
});
