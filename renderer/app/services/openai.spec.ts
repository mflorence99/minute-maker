import { Channels } from '#mm/common';
import { OpenAIService } from '#mm/services/openai';

Object.defineProperty(window, 'ipc', {
  value: {
    invoke: jest.fn()
  }
});

declare const ipc;

describe('OpenAIService', () => {
  it('invokes the openaiChatCompletion channel', () => {
    const openai = new OpenAIService();
    const request = { prompt: 'hello!' };
    openai.chatCompletion(request);
    expect(ipc.invoke).toHaveBeenCalledWith(
      Channels.openaiChatCompletion,
      request
    );
  });

  it('invokes the openaiListModels channel', () => {
    const openai = new OpenAIService();
    openai.models.list();
    expect(ipc.invoke).toHaveBeenCalledWith(Channels.openaiListModels);
  });
});
