import Model, { FileCollection, FileUserCollection } from './collection';
import { currentByUserId, createFile, removeFile, updateFile, accpetShareFile, inviteEmails, denyShareFile} from './service';
import Api from "../../api";
import { serverError500 } from "../base/api";
import _ from 'lodash'

// const Storage = new FilesCollection({
//   collectionName: 'storage',
//   allowClientCode: true,
//   downloadRoute: '/images/',
//   storagePath: 'storage/',
// });

Api.addCollection(FileCollection);

Api.addRoute('files/current', {
    get: {
        authRequired: true,
        action: function () {
            try{
                return currentByUserId(this.userId);
            } catch(e){
                return serverError500({
                    code: 500,
                    message: e.message
                })
            }
        }
    },
    post: {
        authRequired: true,
        action: function () {
             try{
                return createFile({
                    userId: this.userId,
                    bodyParams: this.bodyParams
                })
             } catch(e){
                return serverError500({
                    code: 500,
                    message: e.message
                })
            }
        }
    }
});

Api.addRoute('files/current/:_id', {
    delete: {
        authRequired: true,
        action: function () {
            try{
                return removeFile(this.urlParams._id);
            } catch(e){
                return serverError500({
                    code: 500,
                    message: e.message
                }) 
            }
        }
    },
    post: {
        authRequired: true,
        action: function () {
          try{
            return updateFile({
              _id: this.urlParams._id,
              bodyParams: this.bodyParams
            })
          } catch(e){
            return serverError500({
                code: 500,
                message: e.message
            }) 
        }
      }
    }
});

Api.addRoute('files/current/accpetShareFile', {
    post: {
        authRequired: true,
        action: function () {
          try{
            return accpetShareFile({
              userId: this.userId,
              bodyParams: this.bodyParams
            })
          } catch(e){
            console.log(e)
            return serverError500({
                code: 500,
                message: e.message
            }) 
          }
        }
    }
});

Api.addRoute('files/current/denyShareFile', {
    post: {
        authRequired: true,
        action: function () {
          try{
            return denyShareFile({
              userId: this.userId,
              bodyParams: this.bodyParams
            })
          } catch(e){
            return serverError500({
                code: 500,
                message: e.message
            }) 
          }
        }
    }
});

Api.addRoute('files/current/inviteEmails', {
    post: {
        authRequired: true,
        action: function () {
          try{
            return inviteEmails({
              userId: this.userId,
              bodyParams: this.bodyParams
            })
          } catch(e){
            return serverError500({
                code: 500,
                message: e.message
            }) 
          }
        }
    }
})

// 废弃
Api.addRoute('files/current/type/mp3', {
    get: {
        authRequired: true,
        action: function () {
            let fileUsers = FileUserCollection.find({
                user_id: this.userId,
            }).fetch();
            return _.compact(fileUsers.map(item => Model.findOne({ _id: item.file_id, type: 'mp3' })))
        }
    },
});

// Api.addRoute('files/storage/upload', {
//   post: {
//       authRequired: true,
//       action: function () {
//         console.log('123')
//         const file = this.request;
//         console.log(file)
//       }
//   }
// })