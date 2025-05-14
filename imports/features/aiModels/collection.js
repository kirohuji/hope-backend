import { Class } from "meteor/jagi:astronomy";
export const AiModelsCollection = new Mongo.Collection("ai_models");
// AI模型用户关联集合
export const AiModelsUsersCollection = new Mongo.Collection("ai_models_users");

export default Class.create({
  name: "AiModels",
  collection: AiModelsCollection,
  fields: {
    // 模型的唯一标识符，必填
    value: {
      type: String,
      default: "",
    },
    // 模型的显示名称，必填
    label: {
      type: String,
      default: "",
    },
    // 模型的详细描述，可选
    description: {
      type: String,
      optional: true,
      default: "",
    },
    // 模型类型，必填
    // STT: Speech-to-Text 语音转文字
    // TTS: Text-to-Speech 文字转语音
    // STS: Speech-to-Speech 语音转语音
    // LLM: Large Language Model 大语言模型
    // VISION: Vision & Image 视觉和图像
    // AUDIO: Audio Processing 音频处理
    // VIDEO: Video 视频处理
    // MEMORY: Memory 记忆/存储
    // ANALYTICS: Analytics & Metrics 分析和指标
    // TRANSPORT: Transport 传输
    modelType: {
      type: String,
      default: "",
      validators: [{
        type: 'choice',
        param: {
          choices: ['STT', 'TTS', 'STS', 'LLM', 'VISION', 'AUDIO', 'VIDEO', 'MEMORY', 'ANALYTICS', 'TRANSPORT']
        }
      }]
    },
    // 模型来源类型，必填
    // system: 系统预定义模型
    // custom: 用户定制模型
    sourceType: {
      type: String,
      default: "system",
      validators: [{
        type: 'choice',
        param: {
          choices: ['system', 'custom']
        }
      }]
    },
    // 模型提供商，必填
    // STT 提供商: AssemblyAI, AWS, Azure, Deepgram, Fal Wizper, Gladia, Google, Groq, OpenAI, Parakeet, Ultravox, Whisper
    // TTS 提供商: AWS, Azure, Cartesia, Deepgram, ElevenLabs, FastPitch, Fish, Google, LMNT, Neuphonic, OpenAI, Piper, PlayHT, Rime, XTTS
    // STS 提供商: Gemini Multimodal Live, OpenAI Realtime
    // LLM 提供商: Anthropic, AWS, Azure, Cerebras, DeepSeek, Fireworks AI, Gemini, Grok, Groq, NVIDIA NIM, Ollama, OpenAI, OpenRouter, Perplexity, Qwen, Together AI
    // VISION 提供商: fal, Google Imagen, Moondream
    // AUDIO 提供商: Silero VAD, Krisp, Koala, Noisereduce
    // VIDEO 提供商: Tavus, Simli
    // MEMORY 提供商: mem0
    // ANALYTICS 提供商: Sentry
    // TRANSPORT 提供商: Daily, FastAPI Websocket, SmallWebRTCTransport, WebSocket Server, Local
    provider: {
      type: String,
      default: "",
    },
    // 模型版本号，可选
    version: {
      type: String,
      optional: true,
      default: "",
    },
    // 模型参数配置，可选
    // STT 参数示例：
    // - language: 语言
    // - model: 具体模型名称（如 Whisper-large-v3）
    // - sampleRate: 采样率
    // TTS 参数示例：
    // - voice: 声音类型
    // - language: 语言
    // - speed: 语速
    // - format: 音频格式
    // LLM 参数示例：
    // - temperature: 温度
    // - maxTokens: 最大token数
    // - topP: 采样阈值
    // - model: 具体模型名称（如 gpt-4-turbo）
    // VISION 参数示例：
    // - model: 具体模型名称
    // - resolution: 分辨率
    // - format: 输出格式
    // AUDIO 参数示例：
    // - vadThreshold: VAD阈值
    // - noiseReduction: 降噪级别
    // VIDEO 参数示例：
    // - resolution: 分辨率
    // - fps: 帧率
    // - format: 输出格式
    // TRANSPORT 参数示例：
    // - protocol: 协议类型
    // - port: 端口号
    // - ssl: 是否启用SSL
    parameters: {
      type: Object,
      optional: true,
      default: {},
    },
    // API 密钥，必填（建议加密存储）
    apiKey: {
      type: String,
      default: "",
    },
    // API 端点 URL，可选（如果不提供则使用默认端点）
    endpoint: {
      type: String,
      optional: true,
      default: "",
    },
    // 模型状态：active, inactive, deprecated 等，可选
    status: {
      type: String,
      optional: true,
      default: "active",
    },
    // 速率限制配置，可选
    rateLimit: {
      type: Object,
      optional: true,
      default: {
        // 每分钟请求限制
        requestsPerMinute: 60,
        // 每天请求限制
        requestsPerDay: 1000,
      },
    },
    // 成本配置，可选
    cost: {
      type: Object,
      optional: true,
      default: {
        // 每个 token 的成本
        perToken: 0.0001,
        // 货币单位
        currency: "USD",
      },
    },
    // 创建者ID，必填
    // 对于系统预定义模型，可以是系统管理员ID
    // 对于用户定制模型，是创建该模型的用户ID
    createdBy: {
      type: String,
      default: "",
    },
    // 是否公开，可选
    // 系统预定义模型默认为true
    // 用户定制模型默认为false
    isPublic: {
      type: Boolean,
      optional: true,
      default: true,
    },
    // 是否发布，可选
    published: {
      type: Boolean,
      optional: true,
      default: true,
    },
  },
  behaviors: {
    // 自动添加创建和更新时间戳
    timestamp: {
      hasCreatedField: true,
      createdFieldName: "createdAt",
      hasUpdatedField: true,
      updatedFieldName: "updatedAt",
    },
  },
});

export const AiModelsUsers = Class.create({
  name: "AiModelsUsers",
  collection: AiModelsUsersCollection,
  fields: {
    // 用户ID，必填
    userId: {
      type: String,
      default: "",
    },
    // 模型ID，必填
    modelId: {
      type: String,
      default: "",
    },
    // 使用状态，可选
    // active: 正在使用
    // inactive: 未使用
    // disabled: 已禁用
    status: {
      type: String,
      optional: true,
      default: "active",
      validators: [{
        type: 'choice',
        param: {
          choices: ['active', 'inactive', 'disabled']
        }
      }]
    },
    // 用户自定义的模型参数，可选
    // 可以覆盖默认的模型参数
    customParameters: {
      type: Object,
      optional: true,
      default: {},
    },
    // 用户API密钥，可选
    // 如果用户有自己的API密钥，可以覆盖默认的API密钥
    customApiKey: {
      type: String,
      optional: true,
      default: "",
    },
    // 用户自定义的端点，可选
    // 如果用户有自己的端点，可以覆盖默认的端点
    customEndpoint: {
      type: String,
      optional: true,
      default: "",
    },
    // 使用统计，可选
    usage: {
      type: Object,
      optional: true,
      default: {
        // 总调用次数
        totalCalls: 0,
        // 总token使用量
        totalTokens: 0,
        // 总音频时长（秒）
        totalAudioSeconds: 0,
        // 总视频时长（秒）
        totalVideoSeconds: 0,
        // 最后使用时间
        lastUsedAt: null,
        // 本月使用量
        monthlyUsage: {
          calls: 0,
          tokens: 0,
          audioSeconds: 0,
          videoSeconds: 0,
        },
      },
    },
    // 使用限制，可选
    limits: {
      type: Object,
      optional: true,
      default: {
        // 每日调用限制
        dailyCalls: 1000,
        // 每日token限制
        dailyTokens: 1000000,
        // 每日音频时长限制（秒）
        dailyAudioSeconds: 3600,
        // 每日视频时长限制（秒）
        dailyVideoSeconds: 3600,
        // 每月调用限制
        monthlyCalls: 30000,
        // 每月token限制
        monthlyTokens: 30000000,
        // 每月音频时长限制（秒）
        monthlyAudioSeconds: 108000,
        // 每月视频时长限制（秒）
        monthlyVideoSeconds: 108000,
      },
    },
    // 是否启用，可选
    enabled: {
      type: Boolean,
      optional: true,
      default: true,
    },
    // 备注，可选
    notes: {
      type: String,
      optional: true,
      default: "",
    },
  },
  behaviors: {
    // 自动添加创建和更新时间戳
    timestamp: {
      hasCreatedField: true,
      createdFieldName: "createdAt",
      hasUpdatedField: true,
      updatedFieldName: "updatedAt",
    },
  },
  // 索引定义
  indexes: {
    // 用户ID和模型ID的联合唯一索引
    userIdModelId: {
      fields: {
        userId: 1,
        modelId: 1,
      },
      options: {
        unique: true,
      },
    },
    // 用户ID索引
    userId: {
      fields: {
        userId: 1,
      },
    },
    // 模型ID索引
    modelId: {
      fields: {
        modelId: 1,
      },
    },
  },
}); 