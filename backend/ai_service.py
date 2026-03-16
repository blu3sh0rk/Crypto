import os
from openai import OpenAI

def get_ai_explanation(question_content, options, answer):
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    
    if not api_key:
        return "请配置 AI API Key (OPENAI_API_KEY) 以使用 AI 解答功能。\n\n目前未检测到 API Key，无法调用 AI 接口。"
        
    prompt = f"题目：{question_content}\n选项：{options}\n正确答案：{answer}\n\n请详细解析这道题，解释为什么正确答案是正确的，并简要分析其他选项为什么错误。"
    
    try:
        client = OpenAI(
            base_url=base_url,
            api_key=api_key
        )
        
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            # tools=[{ 
            #     "type": "web_search", 
            #     "max_keyword": 2, 
            # }]
        )
        
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content
        return "AI 未返回有效内容。"
            
    except Exception as e:
        return f"调用 AI 服务时发生错误: {str(e)}"
