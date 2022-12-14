import Api from "../../api";
import Model, { DictionaryCollection } from './collection'
import _ from 'lodash'
import { roleRequired } from "../../utils";
// Api.addCollection(DictionaryCollection, roleRequired('dictionaries', '字典(Dictionaries)'));
Api.addCollection(DictionaryCollection);
Api.addRoute('dictionaries/model', {
    get: function () {
        console.log()
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('dictionaries/findOne', {
    post: function () {
        return DictionaryCollection.findOne(this.bodyParams.selector || {}, this.bodyParams.options)
    }
});
Api.addRoute('dictionaries/pagination', {
    post: function () {
        return {
            data: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch(),
            total: Model.find().count()
        }
    }
});
