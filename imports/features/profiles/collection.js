import { ProfilesCollection } from 'meteor/socialize:user-profile';
import { Class } from "meteor/jagi:astronomy";
export default Class.create({
    name: "Profile",
    collection: ProfilesCollection,
    fields: {
       username: {
        type: String,
        default: '',
        label: '用户名',
        form: {
          use: 'input',
          create: true,
          update: true,
        }
      }
    }
  });
  