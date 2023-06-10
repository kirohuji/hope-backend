import Api from "../../api";
import Model, { BpmnCollection } from './collection'
import _ from 'lodash'
import { roleRequired } from "../../utils";
// Api.addCollection(DictionaryCollection, roleRequired('dictionaries', '字典(Dictionaries)'));
Api.addCollection(BpmnCollection, {
    path: 'bpmns',
    routeOptions: { authRequired: false },
});
Api.addRoute('bpmns/model', {
    get: function () {
        console.log()
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('bpmns/findOne', {
    post: function () {
        return BpmnCollection.findOne(this.bodyParams.selector || {}, this.bodyParams.options)
    }
});
Api.addRoute('bpmns/pagination', {
    post: function () {
        return {
            data: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch(),
            total: Model.find().count()
        }
    }
});
