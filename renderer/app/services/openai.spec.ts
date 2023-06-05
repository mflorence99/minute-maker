import { OpenAIService } from '#mm/services/openai';

// 🔥 currently testing REAL API

describe('OpenAIService', () => {
  it('can be initialized', () => {
    const openai = new OpenAIService();
    expect(openai).toBeDefined();
  });
});
