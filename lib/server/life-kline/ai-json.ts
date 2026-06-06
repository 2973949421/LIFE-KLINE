export class AiJsonParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiJsonParseError';
  }
}

export function summarizeContent(content: string) {
  return content.replace(/\s+/g, ' ').trim().slice(0, 240);
}

export function findBalancedJsonObject(content: string) {
  const start = content.indexOf('{');
  if (start === -1) {
    return '';
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < content.length; index += 1) {
    const char = content[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return content.slice(start, index + 1);
      }
    }
  }

  return '';
}

export function extractJsonBlock(content: string) {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i) || trimmed.match(/```\s*([\s\S]*?)\s*```/);

  if (jsonMatch) {
    const fencedJson = findBalancedJsonObject(jsonMatch[1]);
    if (fencedJson) {
      return fencedJson;
    }
  }

  const jsonObject = findBalancedJsonObject(trimmed);
  if (jsonObject) {
    return jsonObject;
  }

  throw new AiJsonParseError(`AI 返回格式错误，无法解析 JSON。content_preview=${summarizeContent(content)}`);
}

export function extractAssistantContent(data: any) {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (['reasoning', 'reasoning_content', 'thinking'].includes(String(item?.type))) {
          return '';
        }

        if (item?.type === 'text' && typeof item.text === 'string') {
          return item.text;
        }

        if (typeof item?.text === 'string') {
          return item.text;
        }

        if (typeof item?.content === 'string') {
          return item.content;
        }

        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
}

export function parseAssistantJson(content: string) {
  const jsonBlock = extractJsonBlock(content);

  try {
    return JSON.parse(jsonBlock);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AiJsonParseError(`AI 返回格式错误，JSON 解析失败：${message}; content_preview=${summarizeContent(jsonBlock)}`);
  }
}
