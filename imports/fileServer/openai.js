import { Picker } from "meteor/communitypackages:picker";
import https from "https";
import {
  sendMessage,
} from "../features/messaging/service";

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function createOpenai() {
  Picker.route("/openai", (params, req, res) => {
    setReqConfig(res);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const user = getUser(params);
    if (user) {
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
          res.write("data: ");
          response.setEncoding("utf-8");
          response.on("data", (chunk) => {
            res.write(chunk);
            text = text + chunk;
          });
          response.on("end", () =>{
            sendMessage({
              conversationId:  req.body.conversationId,
              userId: user._id,
              bodyParams: {
                body: text,
                attachments:[],
                readedIds: [user._id],
                sendingMessageId: uuidv4(),
                contentType: 'text',
                inFlight: true,
              },
            });
            res.end()
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
    }
  });
}
