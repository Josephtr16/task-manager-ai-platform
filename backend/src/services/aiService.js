const axios = require('axios');

class AIService {
    constructor() {
        this.aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    }

    async predictTask(taskData) {
        try {
            const response = await axios.post(`${this.aiUrl}/predict`, {
                title: taskData.title,
                category: taskData.category,
                priority: taskData.priority,
                subtask_count: taskData.subtasks ? taskData.subtasks.length : 0,
                days_until_deadline: taskData.deadline
                    ? (new Date(taskData.deadline) - new Date()) / (1000 * 60 * 60 * 24)
                    : null
            });

            return {
                aiPredictedDuration: response.data.predicted_duration,
                aiPriorityScore: response.data.priority_score,
                aiInsight: response.data.reason
            };
        } catch (error) {
            console.error('AI Service Error:', error.message);
            // Fallback or ignore
            return {
                aiPriorityScore: 50, // Default medium
                aiInsight: 'AI Service currently unavailable'
            };
        }
    }

    async submitFeedback(actualDuration, predictedDuration) {
        try {
            await axios.post(`${this.aiUrl}/feedback`, {
                actual_duration: actualDuration,
                predicted_duration: predictedDuration
            });
        } catch (error) {
            console.error('AI Feedback Error:', error.message);
        }
    }
}

module.exports = new AIService();
