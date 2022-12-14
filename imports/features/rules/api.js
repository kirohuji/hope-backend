import Api from "../../api";
import Model, { RuleCollection } from './collection'
import { Roles } from 'meteor/alanning:roles';
import _ from 'lodash'
Api.addCollection(RuleCollection, {
    path: 'rules'
});
Api.addRoute('rules/model', {
    get: function () {
        console.log()
        return {
            fields: Model.schema.fields,
            fieldsNames: Model.schema.fieldsNames
        }
    }
});
Api.addRoute('rules/pagination', {
    post: function () {
        return {
            data: RuleCollection.find(this.bodyParams.selector || {}, this.bodyParams.options || {}).fetch(),
            total: Model.find().count()
        }
    }
});
Api.addRoute('rules/findOne', {
    post: function () {
        return RuleCollection.findOne({
            value: this.bodyParams.value
        })
    }
});

// Api.addRoute('routes/generate', {
//     get: function () {
//         RouteCollection.remove({});
//         console.log(Api._routes[21])
//         Api._routes.forEach(element => {
//             RouteCollection.insert({
//                 label: element.path,
//                 value: element.path,
//                 path: element.path,
//                 options: element.options,
//                 endpoints: element.endpoints
//             })
//         });
//         return true;
//     }
// });