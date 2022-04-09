import { Profile, ProfilesCollection } from 'meteor/socialize:user-profile';
import { Class } from "meteor/jagi:astronomy"
import SimpleSchema from "simpl-schema";
const photoURL = new SimpleSchema({
  path: String,
  preview: String
});
Profile.attachSchema({
  displayName: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  photoURL: {
    type: String,
    required: false,
  },
  country: {
    type: String,
    required: false,
  },
  isPublic: {
    type: Boolean,
    required: false,
  },
  state: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: false,
  },
  about: {
    type: String,
    required: false,
  }
})
export default Class.create({
  name: "Profile",
  collection: ProfilesCollection,
  fields: {
    photoURL: {
      type: String,
      default: '',
      label: '头像',
      width: '70px',
      table: {
        use: 'avatar-upload',
      },
      form: {
        use: 'input',
        create: true,
        update: true,
      }
    },
    username: {
      type: String,
      default: '',
      label: '用户名',
      form: {
        use: 'input',
        create: true,
        update: true,
      }
    },
    displayName: {
      type: String,
      default: '',
      label: ' 昵称',
      form: {
        use: 'input',
        create: true,
        update: true,
      }
    },
    phoneNumber: {
      type: String,
      default: '',
      label: '手机号',
      form: {
        use: 'input',
        create: true,
        update: true,
      }
    },
    country: {
      type: String,
      default: '',
      label: '国家',
      form: {
        use: 'input',
        create: true,
        update: true,
      }
    },
    isPublic: {
      type: Boolean,
      default: '',
      label: '是否公开',
      form: {
        use: 'input',
        create: true,
        update: true,
      }
    },
    state: {
      type: String,
      default: '',
      label: '省份',
      form: {
        use: 'input',
        create: true,
        update: true,
      }
    },
    city: {
      type: String,
      default: '',
      label: '城市',
      form: {
        use: 'input',
        create: true,
        update: true,
      }
    },
    address: {
      type: String,
      default: '',
      label: '地址',
      'show-overflow-tooltip': true,
      form: {
        use: 'input',
        create: true,
        update: true,
      }
    },
    about: {
      type: String,
      default: '',
      label: '关于',
      'show-overflow-tooltip': true,
      form: {
        use: 'input',
        create: true,
        update: true,
      }
    }
  }
});
