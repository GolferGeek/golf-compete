import { logger } from './logger.js';
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicClient {
    constructor() {
        this.apiKey = process.env.ANTHROPIC_API_KEY;
        if (!this.apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }
        
        this.model = process.env.MODEL || 'claude-3-sonnet-20240229';
        this.maxTokens = parseInt(process.env.MAX_TOKENS || '4000', 10);
        this.temperature = parseFloat(process.env.TEMPERATURE || '0.7');
        
        this.client = new Anthropic({
            apiKey: this.apiKey
        });
    }

    async complete({ prompt, systemPrompt, maxTokens = this.maxTokens, temperature = this.temperature }) {
        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: maxTokens,
                temperature: temperature,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            return response.content[0].text;
        } catch (error) {
            logger.error('Error calling Anthropic API:', error);
            throw error;
        }
    }
} 