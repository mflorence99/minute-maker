import { OpenAIService } from './open-ai';

jest.mock('openai', () => {
  return {
    // 👇 mock configuration
    Configuration: jest.fn(),

    // 👇 mock API
    OpenAIApi: jest.fn().mockImplementation(() => {
      return {
        createChatCompletion: (): any =>
          Promise.resolve({
            data: {
              choices: [
                { finish_reason: 'stop', message: { content: 'OpenAI' } }
              ]
            }
          }),

        createCompletion: (): any =>
          Promise.resolve({
            data: {
              choices: [{ finish_reason: 'stop', text: 'My name is Mark' }]
            }
          }),

        listModels: (): any =>
          Promise.resolve({
            data: {
              data: [
                { id: 'this' },
                { id: 'that' },
                { id: 'gpt-3.5-turbo' },
                { id: 'text-davinci-003' },
                { id: 'whisper-1' }
              ]
            }
          })
      };
    })
  };
});

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
