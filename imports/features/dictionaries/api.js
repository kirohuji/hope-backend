import Api from "../../api";
import Constructor, { serverError500 } from "../base/api";
import Model, {
  DictionaryOption,
  DictionaryCollection,
  DictionaryOptionCollection,
} from "./collection";
import { pagination, sync } from "./service";
import _ from "lodash";

Api.addCollection(DictionaryCollection);

Constructor("dictionaries", Model);

Api.addCollection(DictionaryOptionCollection, {
  path: "dictionaries/options",
});

Constructor("dictionaries/options", DictionaryOption);

Api.addRoute("dictionaries/pagination", {
  post: function () {
    try {
      return pagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

Api.addRoute("dictionaries/options/pagination", {
  post: function () {
    return {
      data: DictionaryOption.find(
        this.bodyParams.selector || {},
        this.bodyParams.options
      ).fetch(),
      total: DictionaryOption.find().count(),
    };
  },
});

function generate(dictioanry) {
  const nodes = [];
  getData(nodes, dictioanry._id, dictioanry._id);
  return nodes;
}
function getData(nodes, parentId, docId) {
  if (parentId) {
    nodes.children = DictionaryOptionCollection.find({
      dictionaryId: docId,
      parentId,
    }).fetch();
    nodes.children.forEach((node) => {
      getData(nodes, node.parentId, docId);
    });
  }
}
/**
 * dict: label , version
 *
 */
Api.addRoute("dictionaries/generate", {
  post: function () {
    return this.bodyParams.dicts.map((dict) => {
      if (!DictionaryCollection.findOne(dict)) {
        const dictionaries = DictionaryCollection.find(
          {
            label: dict.label,
          },
          {
            sort: [["version", desc]],
            limit: 1,
          }
        ).fetch();
        if (dictionaries && dictionaries[0]) {
          if (this.bodyParams.isTree) {
            return generate(dictionaries[0]);
          } else {
            DictionaryOptionCollection.find({
              parentId: dict._id,
              dictionaryId: dict._id,
            }).fetch();
          }
        }
      }
    });
  },
});

Api.addRoute("dictionaries/dict", {
  post: function () {
    const dictionary = DictionaryCollection.findOne({
      value: this.bodyParams.value,
    });
    if (dictionary) {
      if (this.bodyParams.isTree) {
        return generate(dictionary);
      } else {
        return {
          ...dictionary,
          chidlren: DictionaryOptionCollection.find({
            parentId: dictionary._id,
            dictionaryId: dictionary._id,
          }).fetch(),
        };
      }
    } else {
      return {
        data: [],
      };
    }
  },
});

Api.addRoute("dictionaries/sync", {
  post: function () {
    try {
      return sync(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});
