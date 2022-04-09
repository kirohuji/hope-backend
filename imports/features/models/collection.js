import { Meteor } from "meteor/meteor";
import { Class } from "meteor/jagi:astronomy";
export const ModelCollection = new Mongo.Collection('models')
export default Class.create({
    name: "Model",
    collection: ModelCollection,
    fields: {
        name: {
            type: String,
            default: '',
            label: '模型',
            form: {
                use: 'input',
                create: true,
                update: false,
            }
        },
    }
});
