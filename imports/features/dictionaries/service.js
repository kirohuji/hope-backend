import { DictionaryCollection, DictionaryOptionCollection } from "./collection";
import _ from "lodash";

// 分页查询数据
export function pagination(bodyParams) {
  return {
    data: DictionaryCollection.find(
      bodyParams.selector || {},
      bodyParams.options
    ).fetch(),
    total: DictionaryCollection.find().count(),
  };
}

// 分页查询字典选项
export function getDictionaryOptions(bodyParams) {
  return {
    data: DictionaryOptionCollection.find(
      bodyParams.selector || {},
      bodyParams.options
    ).fetch(),
    total: DictionaryOptionCollection.find().count(),
  };
}

// 生成字典树
function generate(dictionary) {
  const nodes = [];
  getData(nodes, dictionary._id, dictionary._id);
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

export function generateDictionaryTree({ dicts, isTree }) {
  return dicts.map((dict) => {
    if (!DictionaryCollection.findOne(dict)) {
      const dictionaries = DictionaryCollection.find(
        {
          label: dict.label,
        },
        {
          sort: [["version", "desc"]],
          limit: 1,
        }
      ).fetch();
      if (dictionaries && dictionaries[0]) {
        if (isTree) {
          return generate(dictionaries[0]);
        } else {
          return DictionaryOptionCollection.find({
            parentId: dict._id,
            dictionaryId: dict._id,
          }).fetch();
        }
      }
    }
  });
}

// 获取字典
export function getDictionaryByValue({ value, isTree }) {
  const dictionary = DictionaryCollection.findOne({
    value,
  });
  if (dictionary) {
    if (isTree) {
      return generate(dictionary);
    } else {
      return {
        ...dictionary,
        children: DictionaryOptionCollection.find({
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
}

export function sync(bodyParams) {
  const receivedDicts = bodyParams;
  const dicts = DictionaryCollection.find().fetch();
  const updatedDicts = dicts
    .map((dict) => {
      const matchingReceivedDict = _.find(receivedDicts, { _id: dict._id });
      if (
        matchingReceivedDict &&
        matchingReceivedDict.version !== dict.version
      ) {
        return dict; // 保持 dicts 中的
      }
      if (!matchingReceivedDict) {
        return dict; // 需要新增 dict
      }
      return null; // 不做修改
    })
    .filter(Boolean); // 移除 null

  return {
    updated: updatedDicts,
    deleted: _.differenceBy(receivedDicts, dicts, "_id"),
  };
}
