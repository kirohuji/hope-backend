const fs = require("fs");
const { SensitiveWordTool } = require("sensitive-word-tool");
import politics from "sensitive-word-tool/src/words/politics";
// 读取敏感词文件
function loadBadWords(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return data
    .split(/,|\r?\n/)
    .map((word) => word.trim())
    .filter((word) => word);
}

// 初始化敏感词过滤器
export function createFilter(filePath) {
  const sensitiveWordTool = new SensitiveWordTool({
    useDefaultWords: false,
  });
  sensitiveWordTool.addWords([...loadBadWords(filePath), ...politics]);

  return sensitiveWordTool;
}
