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
        logo: {
            type: String,
            default: '',
        },
        description: {
            type: String,
            default: '',
        },
        address: {
            type: String,
            default: '',
        },
        type: {
            type: String,
            default: '',
        },
        organization: {
            type: [Object],
            default: []
        },
        resources: {
            type: [Object],
            default: []
        },
        publish: {
            type: Boolean
        }
    }
});
