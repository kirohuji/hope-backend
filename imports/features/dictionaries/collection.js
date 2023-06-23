import { Class } from "meteor/jagi:astronomy";
export const DictionaryCollection = new Mongo.Collection('dictionaries')
export const DictionaryOptionCollection = new Mongo.Collection('dictionaries_options')

export const DictionaryOption = Class.create({
    name: "DictionaryOption",
    collection: DictionaryOptionCollection,
    fields: {
        value: {
            type: String,
            default: '',
        },
        label: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        version: {
            type: Number,
            default: ''
        },
        type: {
            type: String,
            default: '',
        },
        sort: {
            type: String,
            default: '',
        },
        parentId: {
            type: String,
            default: '',
        },
        dictionaryId: {
            type: String,
            default: '',
        }
    }
});



export default Class.create({
    name: "Dictionary",
    collection: DictionaryCollection,
    fields: {
        value: {
            type: String,
            default: '',
        },
        label: {
            type: String,
            default: '',
        },
        version: {
            type: Number,
            default: ''
        },
        description: {
            type: String,
            default: '',
        },
        type: {
            type: String,
            default: '',
        },
        sort: {
            type: String,
            default: '',
        }
    }
});

