// Node.js API 测试脚本
// 运行: node test-api.mjs

const API_KEY = 'sk-ykrhEuzmR7Egf2wUmq0OWubAltpSYNx2NpubuhdQhWOoytpp0ANl3ozaQqueIo6z';
const BASE_URL = 'https://opencode.ai/zen/go/v1/chat/completions';
const MODEL = 'deepseek-v4-flash';

console.log('==========================================');
console.log('OpenCode Go API 测试');
console.log('==========================================');
console.log('');
console.log(`API 端点: ${BASE_URL}`);
console.log(`模型: ${MODEL}`);
console.log('');

async function testAPI() {
  try {
    console.log('发送测试请求...');

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: '你好，请简短回复' }
        ],
        max_tokens: 20
      })
    });

    console.log(`HTTP 状态码: ${response.status}`);
    console.log('');

    const data = await response.json();
    console.log('响应内容:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (response.ok && data.choices && data.choices.length > 0) {
      console.log('✅ API 测试成功！');
      console.log('');
      console.log('AI 回复:', data.choices[0].message.content);
      console.log('');
      console.log('现在可以启动开发服务器测试完整功能:');
      console.log('  pnpm dev');
      console.log('');
      return true;
    } else {
      console.log('❌ API 测试失败');
      console.log('');
      console.log('请检查:');
      console.log('1. API Key 是否正确');
      console.log('2. OpenCode Go 账户是否有余额');
      console.log('3. 网络连接是否正常');
      return false;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    console.log('');
    console.log('可能的原因:');
    console.log('1. 网络连接问题');
    console.log('2. API 端点地址错误');
    console.log('3. 防火墙阻止了请求');
    return false;
  }
}

console.log('==========================================');
console.log('');

testAPI().then((success) => {
  process.exit(success ? 0 : 1);
});
