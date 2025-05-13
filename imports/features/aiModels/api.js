import Model, { AiModelsCollection } from "./collection";
import { AiModelsUsersCollection } from "./collection";
import Api from "../../api";
import Constructor from "../base/api";
import { serverError500 } from "../base/api";
import {
  pagination,
  getAvailableModels,
  getUserEnabledModels,
  enableModelForUser,
  disableModelForUser,
  updateUserModelConfig,
  createCustomModel,
  updateCustomModel,
  deleteCustomModel,
  getModelDetail,
} from "./service";

Api.addCollection(AiModelsCollection);
Api.addCollection(AiModelsUsersCollection);
Constructor("ai", Model);

// 获取模型列表（分页，管理员接口）
Api.addRoute("ai/admin/pagination", {
  post: function () {
    try {
      // TODO: 添加管理员权限检查
      return pagination(this.bodyParams);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 获取当前用户可用的模型列表
Api.addRoute("ai/available", {
  post: function () {
    try {
      return getAvailableModels(this.userId, this.bodyParams.options);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 获取用户已启用的模型列表
Api.addRoute("ai/user/enabled", {
  post: function () {
    try {
      return getUserEnabledModels(this.userId);
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 启用模型（为用户添加模型关联）
Api.addRoute("ai/user/enable/:modelId", {
  post: function () {
    try {
      const result = enableModelForUser(this.userId, this.urlParams.modelId, this.bodyParams);
      return {
        code: 200,
        message: "Model enabled successfully",
        ...result,
      };
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 禁用模型（更新用户模型关联）
Api.addRoute("ai/user/disable/:modelId", {
  post: function () {
    try {
      const result = disableModelForUser(this.userId, this.urlParams.modelId);
      return {
        code: 200,
        message: "Model disabled successfully",
        ...result,
      };
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 更新用户模型配置
Api.addRoute("ai/user/update/:modelId", {
  post: function () {
    try {
      const result = updateUserModelConfig(this.userId, this.urlParams.modelId, this.bodyParams);
      return {
        code: 200,
        message: "User model configuration updated successfully",
        ...result,
      };
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 创建用户定制模型
Api.addRoute("ai/custom/create", {
  post: function () {
    try {
      const result = createCustomModel(this.userId, this.bodyParams);
      return {
        code: 200,
        data: result,
        message: "Custom model created and enabled successfully",
      };
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 更新用户定制模型
Api.addRoute("ai/custom/update/:modelId", {
  post: function () {
    try {
      const result = updateCustomModel(this.userId, this.urlParams.modelId, this.bodyParams);
      return {
        code: 200,
        message: "Custom model updated successfully",
        ...result,
      };
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 删除用户定制模型
Api.addRoute("ai/custom/delete/:modelId", {
  post: function () {
    try {
      const result = deleteCustomModel(this.userId, this.urlParams.modelId);
      return {
        code: 200,
        message: "Custom model and all user associations deleted successfully",
        ...result,
      };
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});

// 获取模型详情（包括用户配置）
Api.addRoute("ai/detail/:modelId", {
  get: function () {
    try {
      const data = getModelDetail(this.userId, this.urlParams.modelId);
      return {
        code: 200,
        data,
      };
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});
