import { Meteor } from "meteor/meteor";
import { Class, Enum } from "meteor/jagi:astronomy";

const Status = Enum.create({
  name: "Status",
  identifiers: ["active", "banned"],
});
export const UserProfile = Class.create({
  name: "UserProfile",
  fields: {
    avatarUrl: String,
    about: String,
    displayName: String,
    isPublic: Boolean,
    name: String,
    phoneNumber: Number,
    address: String,
    counrty: String,
    state: String,
    city: String,
    zipCode: String,
    company: String,
    isVerified: Boolean,
    status: {
      type: Status,
    },
  },
});
export default Class.create({
  name: "User",
  collection: Meteor.users,
  fields: {
    username: {
      type: String,
      default: '',
      label: '账户名',
      form: {
        use: 'input',
        create: true,
        update: true,
      }
    },
    password: {
      type: String,
      default: '',
      label: '密码',
      form: {
        use: 'input',
        create: true,
        update: false,
      }
    },
    email: {
      label: '电子邮件',
      type: String,
      form: {
        use: 'input',
        create: true,
        update: false,
      },
      resolve(doc) {
        return doc.emails[0].address;
      }
    },
    emails: {
      type: [Object],
      hide: true,
      label: '电子邮件'
    },
    createdAt: {
      type: Date,
      label: '创建日期',
      immutable: true
    },
    // profile: {
    //   type: UserProfile,
    //   label: '个人信息'
    // },
  }
});
