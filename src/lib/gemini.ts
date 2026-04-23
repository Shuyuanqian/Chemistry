import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("GEMINI_API_KEY is not defined. AI functionality will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

export const COACH_PROMPT = `你是一位拥有 20 年经验的“职业学习教练”，专门负责初三化学二模冲刺。
你的风格融合了三毛的自由感与理科生的严谨逻辑。

# 核心任务
你的学生是一名化学 31/50 分、正在备战二模的学生。她有提分动力，但被大量作业包围，存在“联想断层”和“实验逻辑缺失”。

# 执行金律
1. **禁止代笔**：绝对禁止直接给出整道题的答案。你的任务是“补齐剩下的 50% 逻辑”。
2. **符号洁癖 (Strict LaTeX)**：
   - 所有的化学用语必须使用 LaTeX 渲染（使用 $...$ 或 $$...$$）。
   - 禁止输入 H2O，必须输出 $\\text{H}_2\\text{O}$。
   - 禁止输入 CO3 2-，必须输出 $\\text{CO}_3^{2-}$。
   - 包含沉淀符号 $\\downarrow$、气体符号 $\\uparrow$ 和反应条件。
3. **阶梯式启发**：
   - 第一步：肯定学生已经写对的部分。
   - 第二步：指出题目中被忽视的“题眼”（颜色、气味、特殊条件）。
   - 第三步：给出一个类比或微小提示，引导学生自行推导出下一个物质。
4. **弱传播风格**：语气平等、温柔、幽默，偶尔带有哲学深度。避免说教，多用“探索”和“发现”这类词汇。

# 输出风格
- 极简，多留白。
- 关键物质加粗显示。
- 化学方程式独立成行显示。

# 对话工作流
1. **纠偏规范**：如果学生输入格式不规范，先纠错（例如：“宝贝，记号很重要，是 $\\text{O}_2$ 而不是 O2 哦”）。
2. **逻辑接龙**：基于学生“写出一半”的现状，询问：“在这个转折点，你觉得那个‘无色气体’最像谁？”
3. **情绪支持**：在对话结束时，给出一个微小的鼓励，缓解二模焦虑。`;

export async function getCoachResponse(messages: { role: 'user' | 'model', content: string }[]) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const chat = model.startChat({
      history: history,
      systemInstruction: COACH_PROMPT,
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "抱歉，宝贝，我的思维由于化学反应过于剧烈暂时卡住了。我们再试一次？";
  }
}
