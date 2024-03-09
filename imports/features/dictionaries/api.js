import Api from "../../api";
import Model, {
  DictionaryOption,
  DictionaryCollection,
  DictionaryOptionCollection,
} from "./collection";
import _ from "lodash";
// Api.addCollection(DictionaryCollection, roleRequired('dictionaries', '字典(Dictionaries)'));
Api.addCollection(DictionaryCollection);
Api.addRoute("dictionaries/model", {
  get: function () {
    console.log();
    return {
      fields: Model.schema.fields,
      fieldsNames: Model.schema.fieldsNames,
    };
  },
});
Api.addRoute("dictionaries/findOne", {
  post: function () {
    return DictionaryCollection.findOne(
      this.bodyParams.selector || {},
      this.bodyParams.options
    );
  },
});
Api.addRoute("dictionaries/pagination", {
  post: function () {
    return {
      data: Model.find(
        this.bodyParams.selector || {},
        this.bodyParams.options
      ).fetch(),
      total: Model.find().count(),
    };
  },
});

Api.addCollection(DictionaryOptionCollection, {
  path: "dictionaries/options",
  routeOptions: { authRequired: false },
});

Api.addRoute("dictionaries/options/model", {
  get: function () {
    console.log();
    return {
      fields: DictionaryOption.schema.fields,
      fieldsNames: DictionaryOption.schema.fieldsNames,
    };
  },
});

Api.addRoute("dictionaries/options/findOne", {
  post: function () {
    return DictionaryOptionCollection.findOne(
      this.bodyParams.selector || {},
      this.bodyParams.options
    );
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
