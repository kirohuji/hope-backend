import Api from "../../api";
import Images from './collection'
import _ from 'lodash'
Api.addRoute('images/avatar',{
  post: function(){
    console.log(this.request)
  }
})
// Api.addRoute('images',{
//   post: function(){
//     console.log(this.request)
//     return 1
//     // Images.insert({
//     //   file: 'data:image/png,base64str…',
//     //   isBase64: true, // <— Mandatory
//     //   fileName: 'pic.png' // <— Mandatory
//     // });
//   }
// })
// Api.addRoute('images/model', {
//   get: function () {
//     return {
//       fields: User.schema.fields,
//       fieldsNames: User.schema.fieldsNames
//     }
//   }
// });
// Api.addRoute('users/pagination', {
//   post: function () {
//     console.log(this.queryParams)
//     return {
//       data: User.find(this.bodyParams.selector || {}, this.bodyParams.options).fetch().map(item => {
//         return {
//           ..._.omit(item, 'profile'),
//           // ...item.profile
//         }
//       }),
//       total: User.find().count()
//     }
//   }
// });