import { supabase } from '../supabase';
import { BaseService, ServiceResponse } from './BaseService';
import { batchQueue } from '../utils/batchQueue';

export interface Reaction {
  id: string;  
  user_id: string;
  goal_id: string;
  progress_date: string;
  reaction_emoji: string;
  created_at: string;
  users?: {
    username: string;
    name: string;
  };
}

export interface ReactionSummary {
  goal_id: string;
  progress_date: string;
  reactions: {
    [emoji: string]: number; // emoji -> count
  };
  user_reaction?: string; // Current user's reaction emoji
  total_count: number;
}

export class ReactionService extends BaseService {
  constructor() {
    super();
    // Register batch processor for reactions
    batchQueue.registerProcessor('reactions', this.processBatchReactions.bind(this));
  }

  async addReaction(
    goalId: string, 
    progressDate: string, 
    reactionEmoji: string
  ): Promise<ServiceResponse<Reaction>> {
    return batchQueue.add('reactions', {
      type: 'add',
      goalId,
      progressDate,
      reactionEmoji,
    });
  }

  private async processBatchReactions(operations: any[]): Promise<any[]> {
    const results: any[] = [];

    for (const op of operations) {
      try {
        const result = await this._addReactionInternal(op.data.goalId, op.data.progressDate, op.data.reactionEmoji);
        results.push(result);
      } catch (error) {
        results.push(this.createErrorResponse(error));
      }
    }

    return results;
  }

  private async _addReactionInternal(
    goalId: string, 
    progressDate: string, 
    reactionEmoji: string
  ): Promise<ServiceResponse<Reaction>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      // Check if user already reacted to this goal completion
      const { data: existingReaction } = await supabase
        .from('reactions')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_id', goalId)
        .eq('progress_date', progressDate)
        .single();

      if (existingReaction) {
        // Update existing reaction
        const { data, error } = await supabase
          .from('reactions')
          .update({ reaction_emoji: reactionEmoji })
          .eq('id', existingReaction.id)
          .select()
          .single();

        if (error) {
          return this.createErrorResponse(error);
        }

        return this.createSuccessResponse(data);
      } else {
        // Create new reaction
        const { data, error } = await supabase
          .from('reactions')
          .insert({
            user_id: userId,
            goal_id: goalId,
            progress_date: progressDate,
            reaction_emoji: reactionEmoji,
          })
          .select()
          .single();

        if (error) {
          return this.createErrorResponse(error);
        }

        // Create notification for goal owner
        const { data: goalData } = await supabase
          .from('goals')
          .select('user_id, title')
          .eq('id', goalId)
          .single();

        if (goalData && goalData.user_id !== userId) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: goalData.user_id,
              from_user_id: userId,
              type: 'goal_reaction',
              message: `reacted ${reactionEmoji} to your goal "${goalData.title}"`,
              reaction_id: data.id,
            });
          
          if (notificationError) {
            console.error('Failed to create notification:', notificationError);
          }
        }

        return this.createSuccessResponse(data);
      }
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async removeReaction(goalId: string, progressDate: string): Promise<ServiceResponse<void>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('user_id', userId)
        .eq('goal_id', goalId)
        .eq('progress_date', progressDate);

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getReactionSummary(goalId: string, progressDate: string): Promise<ServiceResponse<ReactionSummary>> {
    try {
      const userId = await this.getCurrentUserId();
      
      const { data: reactions, error } = await supabase
        .from('reactions')
        .select('reaction_emoji, user_id')
        .eq('goal_id', goalId)
        .eq('progress_date', progressDate);

      if (error) {
        return this.createErrorResponse(error);
      }

      // Count reactions by emoji
      const reactionCounts: { [key: string]: number } = {};
      let userReaction: string | undefined;
      
      reactions?.forEach(reaction => {
        reactionCounts[reaction.reaction_emoji] = (reactionCounts[reaction.reaction_emoji] || 0) + 1;
        if (reaction.user_id === userId) {
          userReaction = reaction.reaction_emoji;
        }
      });

      const summary: ReactionSummary = {
        goal_id: goalId,
        progress_date: progressDate,
        reactions: reactionCounts,
        user_reaction: userReaction,
        total_count: reactions?.length || 0,
      };

      return this.createSuccessResponse(summary);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getReactionsWithUsers(goalId: string, progressDate: string): Promise<ServiceResponse<Reaction[]>> {
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select(`
          *,
          users(username, name)
        `)
        .eq('goal_id', goalId)
        .eq('progress_date', progressDate)
        .order('created_at', { ascending: false });

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(data || []);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }
}

export const reactionService = new ReactionService();