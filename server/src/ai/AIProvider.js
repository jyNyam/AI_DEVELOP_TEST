// server/src/ai/AIProvider.js

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export class AIProvider {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_KEY?.trim(),
    });

    // OpenAI는 선택적 (fallback용)
    if (process.env.OPENAI_KEY?.trim()) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_KEY?.trim(),
      });
    } else {
      console.log("⚠️ OpenAI 키 없음. Anthropic만 사용합니다.");
      this.openai = null;
    }
  }

  extractTextFromAnthropicResponse(response) {
    if (!response?.content || !Array.isArray(response.content)) return "";

    const textBlocks = response.content
      .filter((item) => item?.type === "text" && typeof item?.text === "string")
      .map((item) => item.text);

    return textBlocks.join("\n").trim(); // \\n → \n 수정
  }

  /**
   * Vision 분석 (PDF/이미지 기반 데이터 추출)
   */
  async callWithVision(buffer, mimetype, prompt) {
    const provider = process.env.AI_PROVIDER || "anthropic";

    if (provider === "anthropic") {
      const model = process.env.ANTHROPIC_VISION_MODEL || "claude-sonnet-4-6";

      try {
        const response = await this.anthropic.messages.create({
          model,
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: mimetype,
                    data: buffer.toString("base64"),
                  },
                },
                {
                  type: "text",
                  text: prompt,
                },
              ],
            },
          ],
        });

        const text = this.extractTextFromAnthropicResponse(response);
        if (!text) {
          throw new Error("Anthropic Vision returned empty text response");
        }

        return text;
      } catch (error) {
        console.error("Vision API Status:", error?.status || "unknown");
        console.error("Vision API Error:", error?.response?.data || error?.message || error);

        throw new Error(
          `Anthropic Vision failed: ${
            error?.error?.message || error?.message || "unknown error"
          }`
        );
      }
    }

    // OpenAI fallback (키가 있을 때만)
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimetype};base64,${buffer.toString("base64")}`,
                  },
                },
              ],
            },
          ],
        });

        return response.choices?.[0]?.message?.content?.trim() || "";
      } catch (error) {
        console.error("OpenAI Vision Error:", error?.message || error);
        throw new Error(`OpenAI Vision failed: ${error?.message || "unknown error"}`);
      }
    }

    throw new Error("No AI provider available. Set ANTHROPIC_KEY or OPENAI_KEY.");
  }

  /**
   * Text 생성 (보호자용 설명 narrative 생성)
   */
  async callText(userPrompt, systemPrompt) {
    const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

    try {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = this.extractTextFromAnthropicResponse(response);

      if (!text) {
        throw new Error("Anthropic Text returned empty response");
      }

      return text;
    } catch (error) {
      console.error("Text API Error:", error?.message || error);
      throw new Error(
        `Anthropic Text failed: ${error?.error?.message || error?.message || "unknown error"}`
      );
    }
  }
}