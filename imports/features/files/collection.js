import { Class } from "meteor/jagi:astronomy";
import { ProfilesCollection } from 'meteor/socialize:user-profile';
export const FileCollection = new Mongo.Collection('files')
export const FileUserCollection = new Mongo.Collection('files_users')

export const FileUser = Class.create({
    name: "FileUser",
    collection: FileUserCollection,
    fields: {
        user_id: {
            type: String,
            default: '',
        },
        file_id: {
            type: String,
            default: '',
        },
        is_main: {
            type: Boolean,
            default: true,
        }
    }
});


export default Class.create({
    name: "File",
    collection: FileCollection,
    fields: {
        value: {
            type: String,
            default: '',
        },
        label: {
            type: String,
            default: '',
            label: '名称',
        },
        url: {
            type: String,
            default: '',
        },
        shared: {
            type: [String],
            default: [],
        },
        tags: {
            type: [String],
            default: [],
        },
        description: {
            type: String,
            default: '',
        },
        size: {
            type: String,
            default: '',
        },
        cover: {
            type: String,
            default: '',
        },
        type: {
            type: String,
            default: '',
        },
        lastModified: {
            type: String,
            default: '',
        },
    }
});