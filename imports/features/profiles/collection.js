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
  status: {
    type: String,
    required: false,
  },
  city: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    required: false,
  },
  age: {
    type: String,
    required: false,
  },
  email: {
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
  },
  available: {
    type: String,
    required: false,
  },
  baptized: {
    type: String,
    required: false,
  },
  scope: {
    type: String,
    required: false,
  },
  realName: {
    type: String,
    required: false,
  },
})
export default Class.create({
  name: "Profile",
  collection: ProfilesCollection,
  fields: {
    photoURL: {
      type: String,
      default: '',
    },
    username: {
      type: String,
      default: '',
    },
    displayName: {
      type: String,
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      default: '',
    },
    age: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: '',
    },
    email: {
      type: String,
      required: false,
    },
    state: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    address: {
      type: String,
    },
    about: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      required: false,
    },
    available: {
      type: String,
      required: false,
    },
    scope: {
      type: String,
      required: false,
    },
    realName: {
      type: String,
      required: false,
    },
  }
});

Meteor.users.after.remove(function afterRemoveUser(userId) {
  console.log('userId',  this.userId)
  console.log('userId',  userId)
  if(userId){
    ProfilesCollection.remove({ _id: userId });
  }
});
