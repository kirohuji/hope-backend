import { Class } from "meteor/jagi:astronomy";
export const TreeCollection = new Mongo.Collection('trees')
export default Class.create({
    name: "Tree",
    collection: TreeCollection,
    fields: {
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
        },
        value: {
            type: [Object],
            default: [],
            label: '数据值',
            form: {
                use: 'tree',
                create: true,
                update: true,
                class: 'full-width tree-card',
                defaultProps: {
                    children: 'children',
                    label: 'label'
                  }
              }
        },
    }
  });
  