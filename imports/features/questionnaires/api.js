import Api from "../../api";
import Model, { QuestionnaireCollection } from './collection'
import _ from 'lodash'
Api.addCollection(QuestionnaireCollection, {
    path: 'questionnaires',
    routeOptions: { QuestionnaireCollection: false },
});
Api.addRoute('questionnaires/model', {
    get: function () {
        console.log()
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('questionnaires/pagination', {
    post: function () {
        return {
            data: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch(),
            total: Model.find().count()
        }
    }
});
