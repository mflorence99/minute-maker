import { Configuration } from 'openai';
import { Injectable } from '@angular/core';
import { OpenAIApi } from 'openai';

import { environment } from '#app/environment';

export type CompletionRequest = {
  max_tokens?: number;
  model?: string;
  prompt: string;
  temperature?: number;
  top_p?: number;
};

export type CompletionResponse = {
  finish_reason: 'length' | 'stop';
  text: string;
};

@Injectable({ providedIn: 'root' })
export class OpenAIService {
  #openai: OpenAIApi;

  constructor() {
    this.#openai = new OpenAIApi(
      new Configuration({
        apiKey: environment.env.OPEN_AI_KEY
      })
    );
  }

  async chatCompletion(
    _request: CompletionRequest
  ): Promise<CompletionResponse> {
    const dflt = {
      max_tokens: 2048,
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      top_p: 1
    };
    // 👇 simplify the API to look the same as "completion"
    const { prompt, ...request } = _request;
    const response = await this.#openai.createChatCompletion({
      messages: [{ content: prompt, role: 'user' }],
      ...request,
      ...dflt
    });
    return {
      finish_reason: response.data.choices[0].finish_reason as any,
      text: response.data.choices[0].message.content
    };
  }

  async completion(request: CompletionRequest): Promise<CompletionResponse> {
    const dflt = {
      max_tokens: 2048,
      model: 'text-davinci-003',
      temperature: 0.5,
      top_p: 1
    };
    const response = await this.#openai.createCompletion({
      ...request,
      ...dflt
    });
    return {
      finish_reason: response.data.choices[0].finish_reason as any,
      text: response.data.choices[0].text
    };
  }

  async listModels(): Promise<string[]> {
    const response = await this.#openai.listModels();
    return response.data.data.map((data) => data.id).sort();
  }
}
