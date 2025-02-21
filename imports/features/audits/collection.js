import { Class } from "meteor/jagi:astronomy";
export const AuditCollection = new Mongo.Collection("audits");
export const AuditUserCollection = new Mongo.Collection("audits_users");

export default Class.create({
  name: "Audit",
  collection: AuditCollection,
  fields: {
    value: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      default: "",
      label: "名称",
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "",
    },
    result: {
      type: String,
      default: "",
    },
    reviewerId: {
      type: String,
      default: "",
    },
    scope: {
      type: String,
      default: "",
    },
  },
});
