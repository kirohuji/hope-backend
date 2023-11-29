import { Class } from "meteor/jagi:astronomy";
export const ScopeCollection = new Mongo.Collection('scopes')
export default Class.create({
    name: "Scope",
    collection: ScopeCollection,
    fields: {
        value: {
            type: String,
            default: '',
        },
        label: {
            type: String,
            default: '',
        },
        cover: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        // address: {
        //     type: String,
        //     default: '',
        // },
        // type: {
        //     type: String,
        //     default: '',
        // },
        // organization: {
        //     type: [Object],
        //     default: []
        // },
        // resources: {
        //     type: [Object],
        //     default: []
        // },
        published: {
            type: Boolean,
            default: true,
        }
    },
    behaviors: {
        timestamp: {
            hasCreatedField: true,
            createdFieldName: 'createdAt',
            hasUpdatedField: true,
            updatedFieldName: 'updatedAt'
        },
        softremove: {
            // The field name with a flag for marking a document as removed.
            removedFieldName: 'removed',
            // A flag indicating if a "removedAt" field should be present in a document.
            hasRemovedAtField: true,
            // The field name storing the removal date.
            removedAtFieldName: 'removedAt'
          }
    }
});
