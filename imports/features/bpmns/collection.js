import { Class } from 'meteor/jagi:astronomy';
export const BpmnCollection = new Mongo.Collection('bpmn:entries');
export default Class.create({
    name: 'BpmnEntry',
    collection: BpmnCollection,
    fields: {
        value: {
            type: String,
            default: '',
            label: ' 值',
        },
        label: {
            type: String,
            default: '',
            label: '名称',
        },
        description: {
            type: String,
            default: '',
            label: '名称',
        },
        type: {
            type: String,
            default: '',
            label: '类型',
        },
        xml: {
            type: String,
            label: '组织权限',
            default: ''
        }
    }
})
