import { Class } from "meteor/jagi:astronomy";
export const RuleRoleCollection = new Mongo.Collection('rules_roles')
export const RuleAssignmentCollection = new Mongo.Collection('rule-assignment')
export const RuleRole = Class.create({
    name: "RuleRole",
    collection: RuleRoleCollection,
    fields: {
        role_id: {
            type: String,
        },
        rule_value: {
            type: String
        },
        router: {
            type: String
        }
    }
})
export const RuleAssignment = Class.create({
    name: "RuleAssignment",
    collection: RuleAssignmentCollection,
    fields: {
        user_id: {
            type: String,
        },
        role_id: {
            type: String,
        },
        rule_value: {
            type: String
        },
        router: {
            type: String
        }
    }
})
export default Class.create({
    name: "Role",
    fields: {
        value: {
            type: Mongo.ObjectID,
            label: '角色值',
            form: {
                use: 'input',
                create: true,
                update: true,
            }
        },
        name: {
            type: String,
            default: '',
            label: '角色名',
            form: {
                use: 'input',
                create: true,
                update: true,
            }
        },
        type: {
            type: String,
            default: '',
            label: '类型',
            form: {
                use: 'input',
                create: true,
                update: true,
            }
        },
        children: {
            type: [Object],
            label: '子节点',
        }
    }
});
