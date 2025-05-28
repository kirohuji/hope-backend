import { TaskStateMachine } from './task-state-machine';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { streamText, generateText, generateObject } from 'ai';
import { z } from 'zod';
export class AITask extends TaskStateMachine {
  async process() {
    const { data } = this.job.data;
    this.deepseek = createDeepSeek({
      apiKey: 'sk-12861433725b4f188739d15b309a49dc',
    });
    try {
      const processedData = await this.preprocessData(data.content);
    
      console.log('AI Task processing completed');
      return processedData;
    } catch (error) {
      console.error('AI Task processing failed:', error);
      throw error;
    }
  }

  async preprocessData(content) {
    const { object: structuredParagraphs } = await generateObject({
      model: this.deepseek.chat('deepseek-chat'),  // 你自己的 deepseek 封装
      schema: z.object({
        paragraphs: z.array(
          z.object({
            paragraph: z.number(),
            text: z.string()
          })
        )
      }),
      prompt: `请将以下英文文本按语义合理分段，每段不宜过长，并返回一个包含 paragraphs 数组的 JSON 对象，每个段落对象包含 paragraph（段落编号）和 text（段落内容）字段。文本如下：\n${content}`
    });
    
    return {
      structuredParagraphs,
      processed: true,
      timestamp: new Date().toISOString()
    };
  }
}
