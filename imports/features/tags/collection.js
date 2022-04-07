import { Class } from "meteor/jagi:astronomy";
export const TagCollection = new Mongo.Collection('tags')
export default Class.create({
    name: "Tag",
    collection: TagCollection,
    fields: {
        value: {
            type: String,
            default: '',
            label: '数据值',
            form: {
                use: 'input',
                create: true,
                update: true,
              }
        },
        name: {
            type: String,
            default: '',
            label: '数据名称',
            form: {
                use: 'input',
                create: true,
                update: true,
              }
        },
        type: {
            type: String,
            default: '',
            label: '数据类型',
            form: {
                use: 'input',
                create: true,
                update: true,
              }
        },
        group: {
            type: String,
            default: '',
            label: '数据分类',
            form: {
                use: 'input',
                create: true,
                update: true,
              }
        }
    }
  });
  