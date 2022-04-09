import { Class } from "meteor/jagi:astronomy";
export const ScopeCollection = new Mongo.Collection('scopes')
export default Class.create({
    name: "Scope",
    collection: ScopeCollection,
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
        type: {
            type: String,
            default: '',
            label: '类型',
            form: {
                use: 'input',
                create: true,
                update: true,
            }
        },
        resources: {
            type: [Object],
            label: '资源',
            default: []
        }
    }
});
