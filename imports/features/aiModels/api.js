import Model, { AiModelsCollection } from "./collection";
import { AiModelsUsersCollection } from "../collections";
import Api from "../../api";
import Constructor from "../base/api";
import { serverError500 } from "../base/api";
import { pagination } from "./service";
import _ from "lodash";
import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";

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
      const userId = this.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const selector = {
        $or: [
          { sourceType: "system", published: true }, // 系统预定义且已发布的模型
          { sourceType: "custom", createdBy: userId }, // 用户自己创建的定制模型
          { sourceType: "custom", isPublic: true, published: true }, // 其他用户创建的公开定制模型
        ],
      };

      return pagination({
        selector,
        options: this.bodyParams.options,
      });
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
      const userId = this.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      // 获取用户已启用的模型关联
      const userModels = AiModelsUsersCollection.find({
        userId,
        enabled: true,
        status: "active",
      }).fetch();

      // 获取关联的模型详情
      const modelIds = userModels.map(um => um.modelId);
      const models = AiModelsCollection.find({
        _id: { $in: modelIds },
        $or: [
          { sourceType: "system", published: true },
          { sourceType: "custom", createdBy: userId },
          { sourceType: "custom", isPublic: true, published: true },
        ],
      }).fetch();

      // 合并模型信息和用户配置
      const result = models.map(model => {
        const userModel = userModels.find(um => um.modelId === model._id);
        return {
          ...model,
          userConfig: {
            customParameters: userModel?.customParameters || {},
            customApiKey: userModel?.customApiKey || "",
            customEndpoint: userModel?.customEndpoint || "",
            status: userModel?.status || "active",
            usage: userModel?.usage || {},
            limits: userModel?.limits || {},
            enabled: userModel?.enabled || false,
          },
        };
      });

      return {
        code: 200,
        data: result,
        total: result.length,
      };
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
      const userId = this.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const { modelId } = this.urlParams;
      const userConfig = this.bodyParams;

      // 检查模型是否可用
      const model = AiModelsCollection.findOne({
        _id: modelId,
        $or: [
          { sourceType: "system", published: true },
          { sourceType: "custom", createdBy: userId },
          { sourceType: "custom", isPublic: true, published: true },
        ],
      });

      if (!model) {
        throw new Error("Model not found or unauthorized");
      }

      // 检查是否已经启用
      const existing = AiModelsUsersCollection.findOne({
        userId,
        modelId,
      });

      if (existing) {
        // 更新现有配置
        AiModelsUsersCollection.update(existing._id, {
          $set: {
            ...userConfig,
            enabled: true,
            status: "active",
          },
        });
      } else {
        // 创建新的关联
        AiModelsUsersCollection.insert({
          userId,
          modelId,
          ...userConfig,
          enabled: true,
          status: "active",
        });
      }

      return {
        code: 200,
        message: "Model enabled successfully",
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
      const userId = this.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const { modelId } = this.urlParams;

      const userModel = AiModelsUsersCollection.findOne({
        userId,
        modelId,
      });

      if (!userModel) {
        throw new Error("Model not found in user's enabled models");
      }

      AiModelsUsersCollection.update(userModel._id, {
        $set: {
          enabled: false,
          status: "inactive",
        },
      });

      return {
        code: 200,
        message: "Model disabled successfully",
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
      const userId = this.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const { modelId } = this.urlParams;
      const updateData = this.bodyParams;

      const userModel = AiModelsUsersCollection.findOne({
        userId,
        modelId,
      });

      if (!userModel) {
        throw new Error("Model not found in user's enabled models");
      }

      // 只允许更新特定字段
      const allowedFields = [
        "customParameters",
        "customApiKey",
        "customEndpoint",
        "limits",
        "notes",
      ];

      const updateFields = _.pick(updateData, allowedFields);
      AiModelsUsersCollection.update(userModel._id, {
        $set: updateFields,
      });

      return {
        code: 200,
        message: "User model configuration updated successfully",
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
      const userId = this.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const modelData = this.bodyParams;
      check(modelData, {
        value: String,
        label: String,
        modelType: String,
        provider: String,
        description: Match.Optional(String),
        parameters: Match.Optional(Object),
        apiKey: Match.Optional(String),
        endpoint: Match.Optional(String),
        isPublic: Match.Optional(Boolean),
      });

      // 设置模型为定制类型
      modelData.sourceType = "custom";
      modelData.createdBy = userId;
      modelData.isPublic = modelData.isPublic || false;
      modelData.published = true;

      const modelId = AiModelsCollection.insert(modelData);

      // 自动为用户启用新创建的模型
      AiModelsUsersCollection.insert({
        userId,
        modelId,
        enabled: true,
        status: "active",
        customParameters: modelData.parameters || {},
        customApiKey: modelData.apiKey || "",
        customEndpoint: modelData.endpoint || "",
      });

      return {
        code: 200,
        data: { modelId },
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
      const userId = this.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const { modelId } = this.urlParams;
      const updateData = this.bodyParams;

      // 检查模型是否存在且属于当前用户
      const model = AiModelsCollection.findOne({
        _id: modelId,
        sourceType: "custom",
        createdBy: userId,
      });

      if (!model) {
        throw new Error("Model not found or unauthorized");
      }

      // 只允许更新特定字段
      const allowedFields = [
        "label",
        "description",
        "parameters",
        "apiKey",
        "endpoint",
        "isPublic",
        "published",
      ];

      const updateFields = _.pick(updateData, allowedFields);
      AiModelsCollection.update(modelId, { $set: updateFields });

      // 同时更新用户自己的模型配置
      const userModel = AiModelsUsersCollection.findOne({
        userId,
        modelId,
      });

      if (userModel) {
        AiModelsUsersCollection.update(userModel._id, {
          $set: {
            customParameters: updateData.parameters || userModel.customParameters,
            customApiKey: updateData.apiKey || userModel.customApiKey,
            customEndpoint: updateData.endpoint || userModel.customEndpoint,
          },
        });
      }

      return {
        code: 200,
        message: "Custom model updated successfully",
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
      const userId = this.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const { modelId } = this.urlParams;

      // 检查模型是否存在且属于当前用户
      const model = AiModelsCollection.findOne({
        _id: modelId,
        sourceType: "custom",
        createdBy: userId,
      });

      if (!model) {
        throw new Error("Model not found or unauthorized");
      }

      // 删除模型
      AiModelsCollection.remove(modelId);

      // 删除所有用户的模型关联
      AiModelsUsersCollection.remove({ modelId });

      return {
        code: 200,
        message: "Custom model and all user associations deleted successfully",
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
      const userId = this.userId;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      const { modelId } = this.urlParams;

      // 获取模型信息
      const model = AiModelsCollection.findOne({
        _id: modelId,
        $or: [
          { sourceType: "system", published: true },
          { sourceType: "custom", createdBy: userId },
          { sourceType: "custom", isPublic: true, published: true },
        ],
      });

      if (!model) {
        throw new Error("Model not found or unauthorized");
      }

      // 获取用户配置
      const userModel = AiModelsUsersCollection.findOne({
        userId,
        modelId,
      });

      return {
        code: 200,
        data: {
          ...model,
          userConfig: userModel ? {
            customParameters: userModel.customParameters,
            customApiKey: userModel.customApiKey,
            customEndpoint: userModel.customEndpoint,
            status: userModel.status,
            usage: userModel.usage,
            limits: userModel.limits,
            enabled: userModel.enabled,
          } : null,
        },
      };
    } catch (e) {
      return serverError500({
        code: 500,
        message: e.message,
      });
    }
  },
});
