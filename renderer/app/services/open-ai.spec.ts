import { OpenAIService } from './open-ai';

// 🔥 we are testing the REAL API

describe('OpenAIService', () => {
  it("calls OpenAI's listModels", () => {
    const openai = new OpenAIService();
    return openai.listModels().then((models) => {
      expect(models).toStrictEqual(
        expect.arrayContaining([
          'gpt-3.5-turbo',
          'text-davinci-003',
          'whisper-1'
        ])
      );
    });
  });

  it("calls OpenAI's createChatCompletion", () => {
    const openai = new OpenAIService();
    return openai
      .chatCompletion({ prompt: 'What is your name?' })
      .then((response) => {
        expect(response.finish_reason).toBe('stop');
        expect(response.text).toContain('OpenAI');
      });
  });

  it("calls OpenAI's createCompletion", () => {
    const openai = new OpenAIService();
    return openai
      .completion({ prompt: 'What is your name?' })
      .then((response) => {
        expect(response.finish_reason).toBe('stop');
        expect(response.text).toContain('My name is');
      });
  });
});
