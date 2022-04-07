import { Class } from "meteor/jagi:astronomy";
export default Class.create({
    name: "Role",
    fields: {
        value: {
            type: Mongo.ObjectID,
            label: '角色值',
            form: {
                use: 'input',
                create: true,
                update: true,
            }
        },
        name: {
            type: String,
            default: '',
            label: '角色名',
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
        children: {
            type: [Object],
            label: '子节点',
        }
    }
});
