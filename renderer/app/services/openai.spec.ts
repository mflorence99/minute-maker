import { OpenAIService } from '#mm/services/openai';

describe('OpenAIService', () => {
  it('can be initialized', () => {
    const openai = new OpenAIService();
    expect(openai).toBeDefined();
  });
});
