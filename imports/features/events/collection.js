import { Class } from "meteor/jagi:astronomy";
export const EventCollection = new Mongo.Collection('events')

export default Class.create({
    name: "Event",
    collection: EventCollection,
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
        description: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            default: '',
        },
        type: {
            type: String,
            default: '',
        },
        start: {
            type:Date,
            default: '',
        },
        allDay: {
            type: String,
            default: '',
        },
        end: {
            type:Date,
            default: '',
        },
        color: {
            type: String,
            default: '',
        },
    }
});
