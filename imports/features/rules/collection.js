import { Class } from "meteor/jagi:astronomy";
import collection from "../scopes/collection";
export const RuleCollection = new Mongo.Collection('rules')
export default Class.create({
    name: "Rule",
    collection: RuleCollection,
    fields: {
        value: {
            type: String,
            default: '',
            label: ' 值',
            form: {
                use: 'input',
                create: true,
                update: true,
            },
            table: {
                use: 'route',
                to: 'contacts'
            }
        },
        label: {
            type: String,
            default: '',
            label: '名称',
            form: {
                use: 'input',
                create: true,
                update: true,
            }
        },
    }
})