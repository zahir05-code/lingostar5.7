import { NextResponse } from "next/server";
import OpenAI from "openai";

// 시스템 환경 변수에 등록된 OPENAI_API_KEY를 자동으로 불러옵니다.
const openai = new OpenAI();

export async function POST(req: Request) {
  try {
    const { text, options } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // 옵션에 따른 동적 프롬프트 생성
    const prompt = `
당신은 **[${options?.targetLevel || '중학교'}]** 대상 영어 내신 및 수능 전문 1타 강사입니다.
다음 영어 지문을 분석하여 요구사항에 맞는 JSON 형식으로 반환해주세요.

[🔥초중요 제약 사항🔥]
- 모든 문법 해설, 오답/정답 해설, 요약, 직독직해, 전문 해석, 강의 팁 등 해설 영역은 **반드시 100% 한국어(Korean)**로만 작성해야 합니다!! 절대 영어로 설명하지 마세요.
- 단, 빈칸 추론 문항의 문제(빈칸이 뚫린 문장)나 문법 문제의 영어 보기 등은 지문 원문 그대로 **반드시 영어**를 사용해야 합니다. 문제 지문을 한글로 번역하여 출제하지 마세요.
- JSON 키 값(key)은 영어로 유지합니다.
- **모든 어휘 추출, 문법 해설의 깊이, 그리고 출제되는 문제의 수준은 정확히 [${options?.targetLevel || '중학교'}] 수준에 맞게(Target Level) 철저하게 조정하세요.**

[지문]
${text}

[생성 요구사항]
${options?.syntax ? '- 본문에 존재하는 **모든 개별 문장**을 단 하나도 빠짐없이 차례대로 구문 분석할 것 (매우 상세하게)' : ''}
${options?.vocab ? '- 주요 어휘 리스트 생성' : ''}
${options?.grammarQuiz ? `- 객관식 문법 문항 정확히 ${options.quizCount || 3}개 생성` : ''}
${options?.cloze ? `- 빈칸 추론 문항 정확히 ${options.quizCount || 3}개 생성` : ''}
${options?.translation ? '- 지문 전문 해석 및 강의 팁 생성' : ''}

[요구사항 - JSON 구조]
{
  "level": "[${options?.targetLevel || '중학교'}] 수준을 고려한 실제 체감 난이도 평가 (예: ${options?.targetLevel} 적정, ${options?.targetLevel} 심화 등)",
  "summary": "지문의 핵심 내용 한 줄 요약 (반드시 한글로 작성)",
  "translation": ${options?.translation ? '"지문 전체에 대한 자연스럽고 정확한 한글 전문 해석"' : 'null'},
  "teaching_tips": ${options?.translation ? '["강사가 수업할 때 학생들에게 강조하면 좋은 꿀팁이나 출제 포인트 1 (반드시 한글로 작성)"]' : '[]'},
  "sentences": ${options?.syntax ? `[
    {
      "original": "지문의 개별 문장 (본문의 첫 문장부터 마지막 문장까지 빠짐없이 모두 배열)",
      "direct_translation": "해당 문장의 직독직해 (의미 단위로 / 로 끊어 읽기 포함)",
      "grammar_explanation": "문장 구조에 대한 매우 상세한 한글 해설 (예: '이 문장은 시간을 나타내는 부사절 ~로 시작하며 주절의 주어는 ~, 동사는 ~입니다. 콤마 뒤의 ~는 선행사 ~를 부연 설명하는 계속적 용법입니다.' 와 같이 주어, 동사, 관계사, 수식어구 등을 꼼꼼히 모두 분석)",
      "highlights": ["본문에서 특별히 강조할 핵심 문법 단어 또는 구문 1", "단어 2"]
    }
  ]` : '[]'},
  "vocabulary": ${options?.vocab ? `[
    { "word": "영단어", "meaning": "한글 뜻", "example": "쉬운 영어 예문" }
  ]` : '[]'},
  "grammar_questions": ${options?.grammarQuiz ? `[
    { "question": "객관식 문법 문제 (어법상 틀린 부분 찾기 등, 질문은 한국어로 작성)", "options": ["보기1", "보기2", "보기3", "보기4"], "answer": "정답 텍스트", "explanation": "왜 이 보기가 정답인지에 대한 상세한 한글 해설" }
  ] (위 객체를 반드시 ${options.quizCount || 3}개 생성하여 배열에 담을 것)` : '[]'},
  "cloze_questions": ${options?.cloze ? `[
    { "question": "빈칸이 뚫린 영어 원문 문장 (빈칸은 ___ 로 표시, 절대 한글 번역 불가)", "answer": "정답 영단어", "distractors": ["오답 영단어1", "오답 영단어2", "오답 영단어3"], "explanation": "왜 정답이고 오답인지에 대한 한글 해설" }
  ] (위 객체를 반드시 ${options.quizCount || 3}개 생성하여 배열에 담을 것)` : '[]'}
}
반드시 올바른 JSON 포맷으로만 응답하세요. 백틱이나 추가 설명 없이 순수 JSON 객체만 반환하세요.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful API that strictly returns valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }, // JSON 응답 강제
    });

    const resultText = response.choices[0].message.content;
    const resultJson = JSON.parse(resultText || "{}");

    return NextResponse.json(resultJson);
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json({ error: "Failed to analyze text" }, { status: 500 });
  }
}
