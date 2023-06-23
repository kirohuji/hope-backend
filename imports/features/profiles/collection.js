import { Profile, ProfilesCollection } from 'meteor/socialize:user-profile';
import { Class, Enum } from "meteor/jagi:astronomy"
import SimpleSchema from "simpl-schema";
const photoURL = new SimpleSchema({
  path: String,
  preview: String
});

const Status = Enum.create({
  name: "Status",
  identifiers: ["active", "freeze"],
});
const fields = {
  photoURL: { // 头像
    type: String
  },
  username: { // 账户名
    type: String,
  },
  gender: { // 性别
    type: String,
  },
  age: { // 年龄
    type: String,
  },
  baptized: { // 洗礼
    type: Boolean,
  },
  displayName: { // 显示名
    type: String,
  },
  phoneNumber: { // 手机号
    type: String,
  },
  country: { // 国家
    type: String,
  },
  email: { // 邮件
    type: String,
  },
  state: { // 州
    type: String,
  },
  city: { // 城市
    type: String,
  },
  address: { // 地址
    type: String,
  },
  about: { // 简介
    type: String,
  },
  status: {
    type: String,
  },
}
Profile.attachSchema(fields)
export default Class.create({
  name: "Profile",
  collection: ProfilesCollection,
  fields: fields,
})
