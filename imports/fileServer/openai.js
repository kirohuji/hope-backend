import { Picker } from "meteor/communitypackages:picker";
import https from "https";
import {
  sendMessage,
  updateConversations,
  updateMessage,
  messageCountByConverstionId,
} from "../features/messaging/service";
import { setReqConfig, getUser } from "./utils";

// 配置常量
const CONFIG = {
  API: {
    BASE_URL: "api.deepseek.com",
    PATH: "/chat/completions",
    KEY: process.env.DEEPSEEK_API_KEY || "sk-d14a278795e34f41b9fe18d2ccd21e10",
  },
  MODEL: {
    NAME: "deepseek-chat",
    MAX_TOKENS: 10,
    TEMPERATURE: 0.7,
  },
};

// 工具函数
export const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 包装 Meteor 环境函数
const wrapMeteorFunction = (fn) => Meteor.bindEnvironment(fn);

const wrappedUpdateMessage = wrapMeteorFunction(updateMessage);
const wrappedUpdateConversation = wrapMeteorFunction(updateConversations);
const wrappedUpdateConversationTitle = wrapMeteorFunction(async ({ text, conversationId }) => {
  if (!messageCountByConverstionId(conversationId)) return;
  
  try {
    const title = await generateTitle(text);
    await wrappedUpdateConversation({
      conversationId,
      label: title,
    });
  } catch (error) {
    console.error("Error generating title:", error);
  }
});

// API 请求处理函数
const handleApiRequest = async (req, res, options) => {
  const { requestData, onSuccess, onError } = options;
  
  return new Promise((resolve, reject) => {
    const sseRequest = https.request(
      {
        method: "POST",
        hostname: CONFIG.API.BASE_URL,
        path: CONFIG.API.PATH,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CONFIG.API.KEY}`,
        },
      },
      (response) => {
        let responseData = "";
        
        response.on("data", (chunk) => {
          responseData += chunk;
          if (onSuccess) onSuccess(chunk);
        });
        
        response.on("end", () => {
          if (response.statusCode === 200) {
            resolve(responseData);
          } else {
            reject(new Error(`API Error: ${response.statusCode}`));
          }
        });
      }
    );

    sseRequest.on("error", (error) => {
      console.error("API Request Error:", error);
      if (onError) onError(error);
      reject(error);
    });

    sseRequest.write(JSON.stringify(requestData));
    sseRequest.end();
  });
};

// 生成标题函数
const generateTitle = async (article) => {
  const requestData = {
    model: CONFIG.MODEL.NAME,
    messages: [
      {
        role: "user",
        content: `根据以下文章内容生成一个合适的标题,只返回内容:\n\n${article}\n\n:`,
      },
    ],
    stream: false,
    max_tokens: CONFIG.MODEL.MAX_TOKENS,
    temperature: CONFIG.MODEL.TEMPERATURE,
  };

  try {
    const responseData = await handleApiRequest(null, null, { requestData });
    const parsedData = JSON.parse(responseData);
    return parsedData.choices[0].message?.content.trim();
  } catch (error) {
    console.error("Title generation error:", error);
    throw error;
  }
};

// 主路由处理函数
export default function createOpenai() {
  Picker.route("/openai", async (params, req, res) => {
    // 处理预检请求
    if (req.method === "OPTIONS") {
      setReqConfig(res);
      res.write(JSON.stringify(true));
      res.end();
      return;
    }

    // 设置响应头
    setReqConfig(res);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let text = "";
    const requestData = {
      model: CONFIG.MODEL.NAME,
      messages: [
        {
          role: "user",
          content: req.body.prompt,
        },
      ],
      stream: true,
    };

    // 处理消息ID
    let messageId = "...";
    if (req.body.conversationId) {
      messageId = sendMessage({
        conversationId: req.body.conversationId,
        userId: "a5u9kNTzKAdghpr55",
        bodyParams: {
          isGenerate: true,
          body: "正在生成中",
          attachments: [],
          sendingMessageId: generateUUID(),
          contentType: "text",
          inFlight: true,
        },
      });
    }
    res.write(`data: ${JSON.stringify({ messageId })}\n\n`);

    try {
      await handleApiRequest(req, res, {
        requestData,
        onSuccess: (chunk) => {
          res.write(chunk);
          if (chunk && !chunk.includes("data: [DONE]")) {
            try {
              const data = JSON.parse(chunk.replace(/^data: /, ""));
              if (data.choices?.[0]) {
                text += data.choices[0].delta?.content || "";
              }
            } catch (e) {
              console.error("Chunk parsing error:", e);
            }
          }
        },
        onError: (error) => {
          res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
          res.end();
        },
      });

      // 处理完成后的操作
      if (req.body.conversationId) {
        await wrappedUpdateMessage({
          messageId,
          text,
        });
        await wrappedUpdateConversationTitle({ 
          text, 
          conversationId: req.body.conversationId 
        });
      }
      res.end();
    } catch (error) {
      console.error("OpenAI processing error:", error);
      res.write(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`);
      res.end();
    }
  });
}
