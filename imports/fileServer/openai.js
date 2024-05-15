import { Picker } from "meteor/communitypackages:picker";
import https from "https";
import {
  sendMessage,
  updateConversations,
  updateMessage,
  messageCountByConverstionId,
} from "../features/messaging/service";
import { setReqConfig, getUser } from "./utils";
export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
const wrappedUpdateMessage = Meteor.bindEnvironment((options) => {
  updateMessage(options);
});
const wrappedUpdateConversation = Meteor.bindEnvironment((options) => {
  updateConversations(options);
});
const wrappedUpdateConverstionTitle = Meteor.bindEnvironment(
  ({ text, conversationId }) => {
    if (messageCountByConverstionId(conversationId)) {
      console.log('生成标题')
      keyword(text)
        .then((title) => {
          console.log(title)
          wrappedUpdateConversation({
            conversationId,
            label: title,
          });
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }
);

export default function createOpenai() {
  Picker.route("/openai", async (params, req, res) => {
    if (req.method === "OPTIONS") {
      // 处理预检请求
      setReqConfig(res);
      res.write(JSON.stringify(true));
      res.end();
      return;
    }
    setReqConfig(res);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // const user = getUser(params);
    // if (user) {
    let text = "";
    const requestData = {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: req.body.prompt,
        },
      ],
      stream: true,
    };
    let messageId = "...";
    if (req.body.conversationId) {
      messageId = sendMessage({
        conversationId: req.body.conversationId,
        userId: "a5u9kNTzKAdghpr55",
        bodyParams: {
          isGenerate: true,
          body: "正在生成中",
          attachments: [],
          sendingMessageId: uuidv4(),
          contentType: "text",
          inFlight: true,
        },
      });
      res.write(`data: ${JSON.stringify({ messageId: messageId })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ messageId: messageId })}\n\n`);
    }
    const sseRequest = https.request(
      {
        method: "POST",
        hostname: "api.deepseek.com",
        path: "/chat/completions",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer sk-d14a278795e34f41b9fe18d2ccd21e10", // 替换为您的API密钥
        },
      },
      (response) => {
        response.setEncoding("utf-8");
        response.on("data", (chunk) => {
          res.write(chunk);
          if (chunk && !chunk.includes("data: [DONE]")) {
            try {
              let data = JSON.parse(chunk.replace(/^data: /, ""));
              if (data.choices && data.choices[0]) {
                text = text + (data.choices[0].delta?.content || "");
              }
            } catch (e) {
              console.log(e);
            }
          }
        });
        response.on("end", () => {
          if (req.body.conversationId) {
            wrappedUpdateMessage({
              messageId,
              text,
            });
            wrappedUpdateConverstionTitle({ text, conversationId: req.body.conversationId});
          }
          res.end();
        });
      }
    );
    sseRequest.on("error", (error) => {
      console.error("Error from OpenAI:", error);
      res.write(
        `data: ${JSON.stringify({ error: "Internal server error" })}\n\n`
      );
      res.end();
    });
    sseRequest.write(JSON.stringify(requestData));
    sseRequest.end();
  });
}

function keyword(article) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content:
            "我给你文章,你总结内容后,只返回总结后内容(英文,不超过15个字):" +
            article,
        },
      ],
      stream: false,
      max_tokens: 20, // 生成的最大标记数，可以根据需要调整
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer sk-d14a278795e34f41b9fe18d2ccd21e10", // 替换为您的 API 密钥
      },
    };

    const req = https.request(
      "https://api.deepseek.com/chat/completions",
      options,
      (response) => {
        let responseData = "";

        response.on("data", (chunk) => {
          responseData += chunk;
        });

        response.on("end", () => {
          if (response.statusCode === 200) {
            const parsedData = JSON.parse(responseData);
            const title = parsedData.choices[0].message?.content.trim();
            resolve(title);
          } else {
            reject(
              new Error(`Error: ${response.statusCode} - ${responseData}`)
            );
          }
        });
      }
    );

    req.on("error", (error) => {
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}
