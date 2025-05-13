import { AiModelsCollection, AiModelsUsersCollection } from './collection'
import _ from 'lodash'
import { check } from 'meteor/check'

// 分页查询数据
export function pagination(bodyParams) {
  return {
    data: AiModelsCollection.find(_.pickBy(bodyParams.selector) || {}, bodyParams.options).fetch(),
    total: AiModelsCollection.find().count()
  }
}

// 获取用户可用的模型列表
export function getAvailableModels(userId, options = {}) {
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const selector = {
    $or: [
      { sourceType: "system", published: true }, // 系统预定义且已发布的模型
      { sourceType: "custom", createdBy: userId }, // 用户自己创建的定制模型
      { sourceType: "custom", isPublic: true, published: true }, // 其他用户创建的公开定制模型
    ],
  }

  return pagination({
    selector,
    options,
  })
}

// 获取用户已启用的模型列表
export function getUserEnabledModels(userId) {
  if (!userId) {
    throw new Error("Unauthorized")
  }

  // 获取用户已启用的模型关联
  const userModels = AiModelsUsersCollection.find({
    userId,
    enabled: true,
    status: "active",
  }).fetch()

  // 获取关联的模型详情
  const modelIds = userModels.map(um => um.modelId)
  const models = AiModelsCollection.find({
    _id: { $in: modelIds },
    $or: [
      { sourceType: "system", published: true },
      { sourceType: "custom", createdBy: userId },
      { sourceType: "custom", isPublic: true, published: true },
    ],
  }).fetch()

  // 合并模型信息和用户配置
  const result = models.map(model => {
    const userModel = userModels.find(um => um.modelId === model._id)
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
    }
  })

  return {
    code: 200,
    data: result,
    total: result.length,
  }
}

// 为用户启用模型
export function enableModelForUser(userId, modelId, userConfig = {}) {
  if (!userId) {
    throw new Error("Unauthorized")
  }

  // 检查模型是否可用
  const model = AiModelsCollection.findOne({
    _id: modelId,
    $or: [
      { sourceType: "system", published: true },
      { sourceType: "custom", createdBy: userId },
      { sourceType: "custom", isPublic: true, published: true },
    ],
  })

  if (!model) {
    throw new Error("Model not found or unauthorized")
  }

  // 检查是否已经启用
  const existing = AiModelsUsersCollection.findOne({
    userId,
    modelId,
  })

  let result
  if (existing) {
    // 更新现有配置
    AiModelsUsersCollection.update(existing._id, {
      $set: {
        ...userConfig,
        enabled: true,
        status: "active",
      },
    })
    result = AiModelsUsersCollection.findOne(existing._id)
  } else {
    // 创建新的关联
    const id = AiModelsUsersCollection.insert({
      userId,
      modelId,
      ...userConfig,
      enabled: true,
      status: "active",
    })
    result = AiModelsUsersCollection.findOne(id)
  }

  return {
    data: {
      ...model,
      userConfig: {
        customParameters: result.customParameters,
        customApiKey: result.customApiKey,
        customEndpoint: result.customEndpoint,
        status: result.status,
        usage: result.usage,
        limits: result.limits,
        enabled: result.enabled,
      },
    },
  }
}

// 为用户禁用模型
export function disableModelForUser(userId, modelId) {
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const userModel = AiModelsUsersCollection.findOne({
    userId,
    modelId,
  })

  if (!userModel) {
    throw new Error("Model not found in user's enabled models")
  }

  AiModelsUsersCollection.update(userModel._id, {
    $set: {
      enabled: false,
      status: "inactive",
    },
  })

  return {
    data: {
      ...userModel,
      enabled: false,
      status: "inactive",
    },
  }
}

// 更新用户模型配置
export function updateUserModelConfig(userId, modelId, updateData) {
  if (!userId) {
    throw new Error("Unauthorized")
  }

  const userModel = AiModelsUsersCollection.findOne({
    userId,
    modelId,
  })

  if (!userModel) {
    throw new Error("Model not found in user's enabled models")
  }

  // 只允许更新特定字段
  const allowedFields = [
    "customParameters",
    "customApiKey",
    "customEndpoint",
    "limits",
    "notes",
  ]

  const updateFields = _.pick(updateData, allowedFields)
  AiModelsUsersCollection.update(userModel._id, {
    $set: updateFields,
  })

  return {
    data: {
      ...userModel,
      ...updateFields,
    },
  }
}

// 创建用户定制模型
export function createCustomModel(userId, modelData) {
  if (!userId) {
    throw new Error("Unauthorized")
  }

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
  })

  // 设置模型为定制类型
  const modelToCreate = {
    ...modelData,
    sourceType: "custom",
    createdBy: userId,
    isPublic: modelData.isPublic || false,
    published: true,
  }

  const modelId = AiModelsCollection.insert(modelToCreate)

  // 自动为用户启用新创建的模型
  AiModelsUsersCollection.insert({
    userId,
    modelId,
    enabled: true,
    status: "active",
    customParameters: modelData.parameters || {},
    customApiKey: modelData.apiKey || "",
    customEndpoint: modelData.endpoint || "",
  })

  return { modelId }
}

// 更新用户定制模型
export function updateCustomModel(userId, modelId, updateData) {
  if (!userId) {
    throw new Error("Unauthorized")
  }

  // 检查模型是否存在且属于当前用户
  const model = AiModelsCollection.findOne({
    _id: modelId,
    sourceType: "custom",
    createdBy: userId,
  })

  if (!model) {
    throw new Error("Model not found or unauthorized")
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
  ]

  const updateFields = _.pick(updateData, allowedFields)
  AiModelsCollection.update(modelId, { $set: updateFields })

  // 同时更新用户自己的模型配置
  const userModel = AiModelsUsersCollection.findOne({
    userId,
    modelId,
  })

  if (userModel) {
    AiModelsUsersCollection.update(userModel._id, {
      $set: {
        customParameters: updateData.parameters || userModel.customParameters,
        customApiKey: updateData.apiKey || userModel.customApiKey,
        customEndpoint: updateData.endpoint || userModel.customEndpoint,
      },
    })
  }

  return {
    data: {
      ...model,
      ...updateFields,
    },
  }
}

// 删除用户定制模型
export function deleteCustomModel(userId, modelId) {
  if (!userId) {
    throw new Error("Unauthorized")
  }

  // 检查模型是否存在且属于当前用户
  const model = AiModelsCollection.findOne({
    _id: modelId,
    sourceType: "custom",
    createdBy: userId,
  })

  if (!model) {
    throw new Error("Model not found or unauthorized")
  }

  // 删除模型
  AiModelsCollection.remove(modelId)

  // 删除所有用户的模型关联
  AiModelsUsersCollection.remove({ modelId })

  return {
    data: { modelId },
  }
}

// 获取模型详情（包括用户配置）
export function getModelDetail(userId, modelId) {
  if (!userId) {
    throw new Error("Unauthorized")
  }

  // 获取模型信息
  const model = AiModelsCollection.findOne({
    _id: modelId,
    $or: [
      { sourceType: "system", published: true },
      { sourceType: "custom", createdBy: userId },
      { sourceType: "custom", isPublic: true, published: true },
    ],
  })

  if (!model) {
    throw new Error("Model not found or unauthorized")
  }

  // 获取用户配置
  const userModel = AiModelsUsersCollection.findOne({
    userId,
    modelId,
  })

  return {
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
  }
}