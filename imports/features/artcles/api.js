import Api from "../../api";
import Model, { ArtcleCollection } from './collection'
import _ from 'lodash'
Api.addCollection(ArtcleCollection);

Api.addRoute('artcles/users/current', {
    post: {
        authRequired: true,
        action: function () {
            return ArtcleCollection.insert({
                author_id: this.userId,
                ...this.bodyParams
            })
        }
    }
})

Api.addRoute('artcles/posts', {
    post: function () {
        return {
            data: Model.find(this.bodyParams.selector || {}, this.bodyParams.options).map(item=>{
                console.log(item)
                return item;
            }),
            total: Model.find().count()
        }
    }
})