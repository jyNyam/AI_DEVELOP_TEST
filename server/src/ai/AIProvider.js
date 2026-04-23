// server/src/ai/AIProvider.js

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

export class AIProvider {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_KEY?.trim(),
    });

    if (process.env.OPENAI_KEY?.trim() || process.env.OPENAI_API_KEY?.trim()) {
      this.openai = new OpenAI({
        apiKey: (process.env.OPENAI_KEY || process.env.OPENAI_API_KEY)?.trim(),
      });
    } else {
      console.log("⚠️ OpenAI 키 없음. Anthropic만 사용합니다.");
      this.openai = null;
    }
  }

  extractTextFromAnthropicResponse(response) {
    return (
      response?.content
        ?.filter((block) => block?.type === "text")
        ?.map((block) => block.text || "")
        ?.join("\n")
        ?.trim() || ""
    );
  }

  // =========================================================
  // 1) 일반 텍스트 생성: explain / 상담 질문 / 내러티브
  // =========================================================
  async call(userMessage, maxTokens = 1500) {
    const provider = process.env.AI_PROVIDER || "anthropic";

    if (provider === "anthropic") {
      return this.#callAnthropic(userMessage, maxTokens);
    }

    if (provider === "openai") {
      if (!this.openai) {
        throw new Error("OpenAI 키가 설정되지 않아 사용할 수 없습니다.");
      }
      return this.#callOpenAI(userMessage, maxTokens);
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  async #callAnthropic(userMessage, maxTokens) {
    try {
      const response = await this.anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        system: SYSTEM_PROMPT,
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      const text = this.extractTextFromAnthropicResponse(response);

      if (!text) {
        throw new Error("Anthropic returned empty text response");
      }

      return text;
    } catch (error) {
      console.error("Anthropic Text Error:", error?.message || error);
      throw new Error(
        `Anthropic Text failed: ${error?.error?.message || error?.message || "unknown error"}`
      );
    }
  }

  async #callOpenAI(userMessage, maxTokens) {
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      });

      const text = response?.choices?.[0]?.message?.content?.trim() || "";

      if (!text) {
        throw new Error("OpenAI returned empty text response");
      }

      return text;
    } catch (error) {
      console.error("OpenAI Text Error:", error?.message || error);
      throw new Error(
        `OpenAI Text failed: ${error?.error?.message || error?.message || "unknown error"}`
      );
    }
  }

  // =========================================================
  // 2) Vision 분석: PDF / 이미지 기반 추출
  // =========================================================
  async callWithVision(buffer, mimetype, prompt, maxTokens = 2000) {
    const provider = process.env.AI_PROVIDER || "anthropic";

    if (provider === "anthropic") {
      const model = process.env.ANTHROPIC_VISION_MODEL || "claude-sonnet-4-6";

      try {
        const response = await this.anthropic.messages.create({
          model,
          max_tokens: maxTokens,
          system: SYSTEM_PROMPT,
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
        console.error("Anthropic Vision Error:", error?.message || error);
        throw new Error(
          `Anthropic Vision failed: ${error?.error?.message || error?.message || "unknown error"}`
        );
      }
    }

    if (provider === "openai") {
      if (!this.openai) {
        throw new Error("OpenAI 키가 설정되지 않아 사용할 수 없습니다.");
      }

      try {
        const response = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          max_tokens: maxTokens,
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

        const text = response?.choices?.[0]?.message?.content?.trim() || "";

        if (!text) {
          throw new Error("OpenAI Vision returned empty text response");
        }

        return text;
      } catch (error) {
        console.error("OpenAI Vision Error:", error?.message || error);
        throw new Error(
          `OpenAI Vision failed: ${error?.error?.message || error?.message || "unknown error"}`
        );
      }
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  // =========================================================
  // 3) 별도 시스템 프롬프트 텍스트 생성용
  // =========================================================
  async callText(userPrompt, systemPrompt, maxTokens = 1500) {
    const provider = process.env.AI_PROVIDER || "anthropic";

    if (provider === "anthropic") {
      try {
        const response = await this.anthropic.messages.create({
          model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
        });

        const text = this.extractTextFromAnthropicResponse(response);

        if (!text) {
          throw new Error("Anthropic callText returned empty response");
        }

        return text;
      } catch (error) {
        console.error("Anthropic callText Error:", error?.message || error);
        throw new Error(
          `Anthropic callText failed: ${error?.error?.message || error?.message || "unknown error"}`
        );
      }
    }

    if (provider === "openai") {
      if (!this.openai) {
        throw new Error("OpenAI 키가 설정되지 않아 사용할 수 없습니다.");
      }

      try {
        const response = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const text = response?.choices?.[0]?.message?.content?.trim() || "";

        if (!text) {
          throw new Error("OpenAI callText returned empty response");
        }

        return text;
      } catch (error) {
        console.error("OpenAI callText Error:", error?.message || error);
        throw new Error(
          `OpenAI callText failed: ${error?.error?.message || error?.message || "unknown error"}`
        );
      }
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
  }
}