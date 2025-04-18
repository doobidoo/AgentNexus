/**
 * Feedback Module for Agent Nexus
 * 
 * Collects, processes, and utilizes feedback from action execution
 * to improve future performance through continuous learning.
 */

import { Plan } from '../planning';
import { ExecutionResult } from './execution';

export interface FeedbackItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'insight' | 'improvement';
  content: string;
  source: 'execution' | 'user' | 'self' | 'system';
  severity: 'low' | 'medium' | 'high';
  subgoalId?: string;
  timestamp: string;
  metrics?: Record<string, any>;
}

export class Feedback {
  /**
   * Collect feedback from execution results
   * 
   * @param plan The original plan
   * @param executionResult Results of the execution
   * @returns Array of feedback items
   */
  collect(plan: Plan, executionResult: ExecutionResult): FeedbackItem[] {
    const feedback: FeedbackItem[] = [];
    
    // Overall execution feedback
    feedback.push(this.generateOverallFeedback(plan, executionResult));
    
    // Subgoal-specific feedback
    for (const subgoal of plan.subgoals) {
      const result = executionResult.stepResults[subgoal.id];
      
      if (result) {
        feedback.push(...this.generateSubgoalFeedback(subgoal, result));
      }
    }
    
    // Adaptation feedback
    if (executionResult.adaptations.length > 0) {
      feedback.push(...this.generateAdaptationFeedback(executionResult.adaptations));
    }
    
    // Performance feedback
    feedback.push(...this.generatePerformanceFeedback(executionResult));
    
    return feedback;
  }
  
  /**
   * Generate feedback on overall execution
   * 
   * @param plan The original plan
   * @param executionResult Results of the execution
   * @returns Feedback item for overall execution
   */
  private generateOverallFeedback(plan: Plan, executionResult: ExecutionResult): FeedbackItem {
    const completionRatio = executionResult.stepsCompleted / plan.subgoals.length;
    
    let type: 'success' | 'error' | 'warning';
    let content: string;
    let severity: 'low' | 'medium' | 'high';
    
    if (completionRatio === 1) {
      type = 'success';
      content = `Successfully executed all ${plan.subgoals.length} subgoals of the plan.`;
      severity = 'low';
    } else if (completionRatio >= 0.7) {
      type = 'warning';
      content = `Partially executed plan, completing ${executionResult.stepsCompleted} out of ${plan.subgoals.length} subgoals.`;
      severity = 'medium';
    } else {
      type = 'error';
      content = `Plan execution largely failed, only completed ${executionResult.stepsCompleted} out of ${plan.subgoals.length} subgoals.`;
      severity = 'high';
    }
    
    return {
      id: `feedback-overall-${Date.now()}`,
      type,
      content,
      source: 'system',
      severity,
      timestamp: new Date().toISOString(),
      metrics: {
        completionRatio,
        duration: executionResult.duration,
        adaptationCount: executionResult.adaptations.length
      }
    };
  }
  
  /**
   * Generate feedback for a specific subgoal
   * 
   * @param subgoal The subgoal that was executed
   * @param result Result of the subgoal execution
   * @returns Array of feedback items for the subgoal
   */
  private generateSubgoalFeedback(subgoal: any, result: any): FeedbackItem[] {
    const feedback: FeedbackItem[] = [];
    
    if (result.error) {
      // Error feedback
      feedback.push({
        id: `feedback-error-${subgoal.id}-${Date.now()}`,
        type: 'error',
        content: `Failed to execute subgoal "${subgoal.description}": ${result.error}`,
        source: 'execution',
        severity: 'high',
        subgoalId: subgoal.id,
        timestamp: new Date().toISOString()
      });
      
      // Improvement suggestion if available
      if (result.adaptation) {
        feedback.push({
          id: `feedback-improvement-${subgoal.id}-${Date.now()}`,
          type: 'improvement',
          content: `Suggested improvement for subgoal "${subgoal.description}": ${result.adaptation}`,
          source: 'self',
          severity: 'medium',
          subgoalId: subgoal.id,
          timestamp: new Date().toISOString()
        });
      }
    } else if (result.completed) {
      // Success feedback
      feedback.push({
        id: `feedback-success-${subgoal.id}-${Date.now()}`,
        type: 'success',
        content: `Successfully executed subgoal "${subgoal.description}"`,
        source: 'execution',
        severity: 'low',
        subgoalId: subgoal.id,
        timestamp: new Date().toISOString()
      });
      
      // Tool usage insights if applicable
      if (result.toolResults) {
        const toolNames = Object.keys(result.toolResults);
        
        if (toolNames.length > 0) {
          feedback.push({
            id: `feedback-tools-${subgoal.id}-${Date.now()}`,
            type: 'insight',
            content: `Subgoal "${subgoal.description}" utilized tools: ${toolNames.join(', ')}`,
            source: 'system',
            severity: 'low',
            subgoalId: subgoal.id,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    return feedback;
  }
  
  /**
   * Generate feedback from adaptations made during execution
   * 
   * @param adaptations Adaptations made during execution
   * @returns Array of feedback items about adaptations
   */
  private generateAdaptationFeedback(adaptations: Array<{step: string; reason: string; adaptation: string}>): FeedbackItem[] {
    return adaptations.map(adaptation => ({
      id: `feedback-adaptation-${adaptation.step}-${Date.now()}`,
      type: 'improvement',
      content: `Adapted execution approach for ${adaptation.step}: ${adaptation.adaptation} (Reason: ${adaptation.reason})`,
      source: 'self',
      severity: 'medium',
      subgoalId: adaptation.step,
      timestamp: new Date().toISOString()
    }));
  }
  
  /**
   * Generate feedback about performance aspects
   * 
   * @param executionResult Results of the execution
   * @returns Array of feedback items about performance
   */
  private generatePerformanceFeedback(executionResult: ExecutionResult): FeedbackItem[] {
    const feedback: FeedbackItem[] = [];
    
    // Execution time feedback
    const executionTimeMs = executionResult.duration;
    let timePerformance: FeedbackItem['type'] = 'success';
    let timeSeverity: FeedbackItem['severity'] = 'low';
    let timeContent = `Execution completed in ${executionTimeMs}ms, which is within expected parameters.`;
    
    if (executionTimeMs > 10000) {
      timePerformance = 'warning';
      timeSeverity = 'medium';
      timeContent = `Execution took ${executionTimeMs}ms, which is longer than optimal. Consider optimization.`;
    }
    
    if (executionTimeMs > 30000) {
      timePerformance = 'error';
      timeSeverity = 'high';
      timeContent = `Execution took ${executionTimeMs}ms, which is excessively long. Significant optimization required.`;
    }
    
    feedback.push({
      id: `feedback-performance-time-${Date.now()}`,
      type: timePerformance,
      content: timeContent,
      source: 'system',
      severity: timeSeverity,
      timestamp: new Date().toISOString(),
      metrics: {
        executionTimeMs,
        stepsCompleted: executionResult.stepsCompleted
      }
    });
    
    // Adaptation frequency feedback
    if (executionResult.adaptations.length > Math.ceil(executionResult.stepsCompleted * 0.3)) {
      feedback.push({
        id: `feedback-performance-adaptations-${Date.now()}`,
        type: 'warning',
        content: `High adaptation rate (${executionResult.adaptations.length} adaptations in ${executionResult.stepsCompleted} steps) suggests plan quality issues.`,
        source: 'system',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        metrics: {
          adaptationRate: executionResult.adaptations.length / executionResult.stepsCompleted
        }
      });
    }
    
    return feedback;
  }
  
  /**
   * Add user feedback to the feedback collection
   * 
   * @param content User feedback content
   * @param severity Feedback severity
   * @param subgoalId Optional ID of the specific subgoal the feedback is about
   * @returns The created feedback item
   */
  addUserFeedback(content: string, severity: FeedbackItem['severity'] = 'medium', subgoalId?: string): FeedbackItem {
    const feedback: FeedbackItem = {
      id: `feedback-user-${Date.now()}`,
      type: 'insight',
      content,
      source: 'user',
      severity,
      timestamp: new Date().toISOString()
    };
    
    if (subgoalId) {
      feedback.subgoalId = subgoalId;
    }
    
    return feedback;
  }
  
  /**
   * Process feedback to extract actionable insights
   * 
   * @param feedbackItems Array of feedback items to process
   * @returns Array of insights extracted from feedback
   */
  processInsights(feedbackItems: FeedbackItem[]): string[] {
    // In a real implementation, this would use more sophisticated analysis
    // For now, we'll extract simple insights based on feedback patterns
    
    const insights: string[] = [];
    
    // Count feedback types
    const typeCounts: Record<string, number> = {};
    feedbackItems.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });
    
    // Extract insights based on counts
    if (typeCounts['error'] > 0) {
      insights.push(`${typeCounts['error']} errors were encountered during execution. Review error feedback for details.`);
    }
    
    if (typeCounts['improvement'] > 0) {
      insights.push(`${typeCounts['improvement']} improvement suggestions were generated. Consider implementing these changes.`);
    }
    
    // Look for common themes in failure feedback
    const errorMessages = feedbackItems
      .filter(item => item.type === 'error')
      .map(item => item.content);
    
    const commonErrorPatterns = this.findCommonPatterns(errorMessages);
    if (commonErrorPatterns.length > 0) {
      insights.push(`Common error patterns detected: ${commonErrorPatterns.join(', ')}`);
    }
    
    return insights;
  }
  
  /**
   * Find common patterns in an array of strings
   * 
   * @param strings Array of strings to analyze
   * @returns Array of common patterns found
   */
  private findCommonPatterns(strings: string[]): string[] {
    // Simplified implementation
    // In a real system, this would use more sophisticated NLP techniques
    
    if (strings.length < 2) return [];
    
    const patterns: Record<string, number> = {};
    
    // Look for common words and phrases
    strings.forEach(str => {
      const words = str.toLowerCase().split(/\W+/).filter(w => w.length > 4);
      
      words.forEach(word => {
        patterns[word] = (patterns[word] || 0) + 1;
      });
    });
    
    // Extract patterns that appear in multiple strings
    return Object.entries(patterns)
      .filter(([_, count]) => count > 1)
      .map(([pattern, _]) => pattern)
      .slice(0, 3); // Limit to top 3 patterns
  }
}
