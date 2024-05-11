import Model, { AiModelsCollection } from "./collection";
import Api from "../../api";
import Constructor from "../base/api";
import { serverError500 } from "../base/api";
import { pagination } from "./service";
import _ from "lodash";
import { HTTP } from "meteor/http";

const config = (prompt) => ({
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer sk-d14a278795e34f41b9fe18d2ccd21e10", // 替换为您的API密钥
  },
  data: {
    model: "deepseek-chat",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 50,
  },
  stream: true, // 设置为true以启用流式处理
});

Api.addCollection(AiModelsCollection);
Constructor("ai", Model);

Api.addRoute("ai/pagination", {
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

Api.addRoute("ai/current", {
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

Meteor.methods({
  async getChatGPTResponseStream(prompt) {
    console.log("收到");
    try {
      const response = HTTP.call(
        "POST",
        "https://api.deepseek.com/chat/completions",
        config(prompt)
      );

      // 返回响应流
      return response;
    } catch (error) {
      throw new Meteor.Error(
        "api-error",
        "Failed to fetch response from OpenAI API"
      );
    }
  },
});
