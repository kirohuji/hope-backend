import Api from "../../api";
import Constructor, { serverError500 } from "../base/api";
import Model, {
  DictionaryOption,
  DictionaryCollection,
  DictionaryOptionCollection,
} from "./collection";
import {
  pagination,
  sync,
  getDictionaryOptions,
  generateDictionaryTree,
  getDictionaryByValue,
} from "./service";

Api.addCollection(DictionaryCollection);

Constructor("dictionaries", Model);

Api.addCollection(DictionaryOptionCollection, {
  path: "dictionaries/options",
});

Constructor("dictionaries/options", DictionaryOption);

// 分页查询字典
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

// 分页查询字典选项
Api.addRoute("dictionaries/options/pagination", {
  post: function () {
    try {
      return getDictionaryOptions(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 生成字典树
Api.addRoute("dictionaries/generate", {
  post: function () {
    try {
      return generateDictionaryTree({
        dicts: this.bodyParams.dicts,
        isTree: this.bodyParams.isTree,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 获取字典
Api.addRoute("dictionaries/dict", {
  post: function () {
    try {
      return getDictionaryByValue({
        value: this.bodyParams.value,
        isTree: this.bodyParams.isTree,
      });
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 同步字典
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
