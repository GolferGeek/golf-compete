import { logger } from '../utils/logger.js';

export async function generateTasks(prdContent, anthropic) {
    try {
        const systemPrompt = `You are a technical project manager helping to break down a PRD into specific, actionable tasks.
Each task should have:
- A unique ID
- A clear title
- A description of what needs to be done
- Any dependencies (IDs of tasks that must be completed first)
- A status (default to 'pending')
- Priority level (high, medium, low)
- Implementation details
- Test strategy

Focus on:
- Creating atomic, self-contained tasks
- Identifying clear dependencies
- Providing enough detail for implementation
- Including validation/testing requirements`;

        const userPrompt = `Please analyze this PRD and break it down into specific tasks:

${prdContent}

Format each task as a JSON object with the following structure:
{
    "id": number,
    "title": "string",
    "description": "string",
    "dependencies": [numbers],
    "status": "pending",
    "priority": "high|medium|low",
    "details": "string",
    "testStrategy": "string"
}

Return an array of these task objects, ordered by dependency chain.`;

        const response = await anthropic.messages.create({
            model: process.env.MODEL || 'claude-3-7-sonnet-20250219',
            max_tokens: parseInt(process.env.MAX_TOKENS || '4000'),
            temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        });

        // Extract JSON content from markdown response
        const jsonContent = response.content[0].text
            .replace(/```json\n/, '')  // Remove opening markdown
            .replace(/\n```$/, '')     // Remove closing markdown
            .trim();                   // Clean up whitespace

        const tasks = JSON.parse(jsonContent);
        logger.info(`Generated ${tasks.length} tasks from PRD`);
        return tasks;
    } catch (error) {
        logger.error('Error generating tasks:', error);
        throw error;
    }
} 