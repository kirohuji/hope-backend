import { Class } from "meteor/jagi:astronomy";
export const RouteCollection = new Mongo.Collection('routes')
export default Class.create({
    name: "Route",
    collection: RouteCollection,
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
        // type: {
        //     type: String,
        //     default: '',
        //     label: '类型',
        //     form: {
        //         use: 'input',
        //         create: true,
        //         update: true,
        //     }
        // },
        // permission: {
        //     type: String,
        //     label: '组织权限',
        //     default: []
        // }
    }
});