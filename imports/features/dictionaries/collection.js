import { Class } from "meteor/jagi:astronomy";
export const DictionaryCollection = new Mongo.Collection('dictionaries')
export default Class.create({
    name: "Dictionary",
    collection: DictionaryCollection,
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
        description: {
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
        json: {
            type: [Object],
            label: '组织权限',
            default: []
        }
    }
});
