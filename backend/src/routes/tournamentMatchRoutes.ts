import { FastifyInstance, FastifyPluginAsync } from "fastify";
import mongoose from "mongoose";
import TournamentMatch from "../models/TournamentMatch";
import Tournament from "../models/Tournament";
import TournamentRegistration from "../models/TournamentRegistration";
import Squad from "../models/Squad";
import { DivisionService } from "../services/divisionService";

const tournamentMatchRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // Health check
  fastify.get("/health", async (request, reply) => {
    return reply.send({
      success: true,
      message: "Tournament match routes available",
      timestamp: new Date().toISOString(),
    });
  });

  // Generate matches for a tournament when it starts
  fastify.post("/generate/:tournamentId", async (request, reply) => {
    try {
      const { tournamentId } = request.params as { tournamentId: string };

      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return reply.status(404).send({
          success: false,
          message: "Tournament not found",
        });
      }

      if (tournament.status !== "ongoing") {
        return reply.status(400).send({
          success: false,
          message: "Tournament must be in 'ongoing' status to generate matches",
        });
      }

      // Get all registered squads for this tournament
      const registrations = await TournamentRegistration.find({
        tournament: tournamentId,
        status: "approved",
      }).populate("squad");

      if (registrations.length < 2) {
        return reply.status(400).send({
          success: false,
          message: "Need at least 2 squads to generate matches",
        });
      }

      // Check if matches already exist
      const existingMatches = await TournamentMatch.find({
        tournament: tournamentId,
      });
      if (existingMatches.length > 0) {
        return reply.status(400).send({
          success: false,
          message: "Matches already generated for this tournament",
        });
      }

      // Generate matches using the service
      const { generateTournamentMatches } = await import(
        "../services/tournamentMatchService"
      );
      await generateTournamentMatches(tournamentId);

      // Get the generated matches
      const matches = await TournamentMatch.find({ tournament: tournamentId });

      return reply.status(201).send({
        success: true,
        message: `Generated ${matches.length} matches for tournament ${tournament.name}`,
        matchCount: matches.length,
      });
    } catch (error) {
      console.error("Error generating tournament matches:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to generate tournament matches",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Get all matches for a tournament
  fastify.get("/tournament/:tournamentId", async (request, reply) => {
    try {
      const { tournamentId } = request.params as { tournamentId: string };

      let matches = await TournamentMatch.find({ tournament: tournamentId })
        .populate("squad1", "name tag")
        .populate("squad2", "name tag")
        .populate("winner", "name tag")
        .populate("loser", "name tag")
        .sort({ round: 1, matchNumber: 1 });

      // Auto-generate matches if none exist and tournament has enough squads
      if (matches.length === 0) {
        const tournament = await Tournament.findById(tournamentId);
        if (tournament && (tournament.currentSquads || 0) >= 2) {
          const { generateTournamentMatches } = await import(
            "../services/tournamentMatchService"
          );
          await generateTournamentMatches(tournamentId);

          // Re-fetch after generation
          matches = await TournamentMatch.find({ tournament: tournamentId })
            .populate("squad1", "name tag")
            .populate("squad2", "name tag")
            .populate("winner", "name tag")
            .populate("loser", "name tag")
            .sort({ round: 1, matchNumber: 1 });
        }
      }

      return reply.status(200).send({
        success: true,
        matches,
      });
    } catch (error) {
      console.error("Error getting tournament matches:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get tournament matches",
      });
    }
  });

  // Update match result (admin only)
  fastify.put("/:matchId/result", async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };
      const { winnerId, loserId, score, adminNotes, applyLoserDeduction } =
        request.body as any;

      if (!winnerId || !loserId) {
        return reply.status(400).send({
          success: false,
          message: "Winner and loser IDs are required",
        });
      }

      const match = await TournamentMatch.findById(matchId);
      if (!match) {
        return reply.status(404).send({
          success: false,
          message: "Match not found",
        });
      }

      if (match.status === "completed") {
        return reply.status(400).send({
          success: false,
          message: "Match already completed",
        });
      }

      // Validate winner and loser
      if (
        winnerId !== match.squad1.toString() &&
        winnerId !== match.squad2.toString()
      ) {
        return reply.status(400).send({
          success: false,
          message: "Winner must be one of the participating squads",
        });
      }

      if (
        loserId !== match.squad1.toString() &&
        loserId !== match.squad2.toString()
      ) {
        return reply.status(400).send({
          success: false,
          message: "Loser must be one of the participating squads",
        });
      }

      if (winnerId === loserId) {
        return reply.status(400).send({
          success: false,
          message: "Winner and loser cannot be the same",
        });
      }

      // Update match
      match.winner = winnerId;
      match.loser = loserId;
      match.status = "completed";
      match.endTime = new Date();
      match.score = score;
      match.adminNotes = adminNotes;
      if (typeof applyLoserDeduction === "boolean") {
        (match as any).applyLoserDeduction = applyLoserDeduction;
      }

      // Save match first so service can read the updated winner/loser
      await match.save();

      // Process bounty coins and division changes
      await DivisionService.processMatchResult(matchId);

      // Trigger achievement checks for match completion
      try {
        const { AchievementService } = await import("../services/achievementService");
        
        // Get squad members for winner and loser
        const winnerSquad = await Squad.findById(match.winner);
        const loserSquad = await Squad.findById(match.loser);
        
        if (winnerSquad && winnerSquad.members) {
          // Trigger achievement for each winner squad member
          for (const member of winnerSquad.members) {
            await AchievementService.processAchievementTrigger({
              userId: member,
              type: "match_win",
              data: {
                game: "Mobile Legends: Bang Bang",
                tournamentId: match.tournament as mongoose.Types.ObjectId,
                matchId: match._id as mongoose.Types.ObjectId,
                matchWon: true,
                tournamentWon: false, // This will be set to true when tournament is completed
              },
            });
          }
        }
        
        if (loserSquad && loserSquad.members) {
          // Trigger achievement for each loser squad member
          for (const member of loserSquad.members) {
            await AchievementService.processAchievementTrigger({
              userId: member,
              type: "match_loss",
              data: {
                game: "Mobile Legends: Bang Bang",
                tournamentId: match.tournament as mongoose.Types.ObjectId,
                matchId: match._id as mongoose.Types.ObjectId,
                matchWon: false,
              },
            });
          }
        }
      } catch (achievementError) {
        console.error("Error processing achievement triggers:", achievementError);
        // Don't fail the match completion if achievement processing fails
      }

      // If the whole round is completed, auto-generate next round (Single Elimination)
      try {
        const currentRound = match.round;
        const currentTournamentId = match.tournament.toString();

        const roundMatches = await TournamentMatch.find({
          tournament: currentTournamentId,
          round: currentRound,
        })
          .sort({ matchNumber: 1 })
          .lean();

        const allCompleted = roundMatches.every(
          (m) => m.status === "completed"
        );
        if (allCompleted) {
          const winners = roundMatches
            .map((m) => m.winner)
            .filter((w): w is any => !!w);

          if (winners.length >= 2) {
            // Prepare next round matches by pairing winners in order
            const nextRound = currentRound + 1;

            const lastMatch = await TournamentMatch.find({
              tournament: currentTournamentId,
            })
              .sort({ matchNumber: -1 })
              .limit(1);
            let nextMatchNumber = lastMatch[0]?.matchNumber
              ? lastMatch[0].matchNumber + 1
              : 1;

            const newMatches: any[] = [];
            for (let i = 0; i < winners.length; i += 2) {
              if (winners[i] && winners[i + 1]) {
                newMatches.push({
                  tournament: match.tournament,
                  matchNumber: nextMatchNumber++,
                  round: nextRound,
                  squad1: winners[i],
                  squad2: winners[i + 1],
                  status: "scheduled",
                  scheduledTime: new Date(),
                  bountyCoinAmount: 50,
                  matchType: "normal",
                });
              }
            }

            if (newMatches.length > 0) {
              await TournamentMatch.insertMany(newMatches);
            } else if (winners.length === 1) {
              // Edge case: only one winner remains
              await Tournament.findByIdAndUpdate(currentTournamentId, {
                status: "completed",
                endDate: new Date(),
              });
            }
          } else if (winners.length === 1) {
            // Tournament finished
            await Tournament.findByIdAndUpdate(currentTournamentId, {
              status: "completed",
              endDate: new Date(),
            });
          }
        }
      } catch (e) {
        console.error("Auto-advance round error:", e);
      }

      // Return the updated match
      const updatedMatch = await TournamentMatch.findById(matchId)
        .populate("squad1", "name tag")
        .populate("squad2", "name tag")
        .populate("winner", "name tag")
        .populate("loser", "name tag");

      return reply.status(200).send({
        success: true,
        message: "Match result updated successfully",
        match: updatedMatch,
      });
    } catch (error) {
      console.error("Error updating match result:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to update match result",
        error:
          process.env.NODE_ENV === "development"
            ? (error as any).message
            : undefined,
      });
    }
  });

  // Update bounty coin settings for a match (admin only)
  fastify.put("/:matchId/bounty", async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };
      const { bountyCoinAmount, applyLoserDeduction } = request.body as {
        bountyCoinAmount?: number;
        applyLoserDeduction?: boolean;
      };

      const match = await TournamentMatch.findById(matchId);
      if (!match) {
        return reply
          .status(404)
          .send({ success: false, message: "Match not found" });
      }

      if (typeof bountyCoinAmount === "number") {
        match.bountyCoinAmount = Math.max(0, bountyCoinAmount);
      }
      if (typeof applyLoserDeduction === "boolean") {
        (match as any).applyLoserDeduction = applyLoserDeduction;
      }

      await match.save();

      return reply.status(200).send({
        success: true,
        message: "Bounty settings updated",
        match,
      });
    } catch (error) {
      console.error("Error updating match bounty settings:", error);
      return reply
        .status(500)
        .send({ success: false, message: "Failed to update bounty settings" });
    }
  });

  // Get match statistics for a tournament
  fastify.get("/tournament/:tournamentId/stats", async (request, reply) => {
    try {
      const { tournamentId } = request.params as { tournamentId: string };

      const matches = await TournamentMatch.find({ tournament: tournamentId });

      const totalMatches = matches.length;
      const completedMatches = matches.filter(
        (m) => m.status === "completed"
      ).length;
      const pendingMatches = matches.filter(
        (m) => m.status === "scheduled"
      ).length;
      const inProgressMatches = matches.filter(
        (m) => m.status === "in_progress"
      ).length;

      // Get squad statistics using the service
      const { getSquadStats } = await import(
        "../services/tournamentMatchService"
      );
      const squadStats = getSquadStats(matches);

      return reply.status(200).send({
        success: true,
        stats: {
          totalMatches,
          completedMatches,
          pendingMatches,
          inProgressMatches,
          squadStats,
        },
      });
    } catch (error) {
      console.error("Error getting tournament stats:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get tournament statistics",
      });
    }
  });

  // Create a new match (admin only)
  fastify.post("/", async (request, reply) => {
    try {
      const {
        tournamentId,
        matchNumber,
        round,
        squad1Id,
        squad2Id,
        scheduledTime,
        status = "scheduled",
        bountyCoinAmount = 50,
        matchType = "normal",
      } = request.body as any;

      if (!tournamentId || !matchNumber || !round || !squad1Id || !squad2Id) {
        return reply.status(400).send({
          success: false,
          message:
            "Tournament ID, match number, round, and both squad IDs are required",
        });
      }

      // Validate tournament exists
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return reply.status(404).send({
          success: false,
          message: "Tournament not found",
        });
      }

      // Validate squads exist
      const [squad1, squad2] = await Promise.all([
        Squad.findById(squad1Id),
        Squad.findById(squad2Id),
      ]);

      if (!squad1 || !squad2) {
        return reply.status(404).send({
          success: false,
          message: "One or both squads not found",
        });
      }

      if (squad1Id === squad2Id) {
        return reply.status(400).send({
          success: false,
          message: "Squad 1 and Squad 2 cannot be the same",
        });
      }

      // Check if match number already exists for this tournament
      const existingMatch = await TournamentMatch.findOne({
        tournament: tournamentId,
        matchNumber,
      });

      if (existingMatch) {
        return reply.status(400).send({
          success: false,
          message: `Match number ${matchNumber} already exists for this tournament`,
        });
      }

      // Create new match
      const newMatch = new TournamentMatch({
        tournament: tournamentId,
        matchNumber,
        round,
        squad1: squad1Id,
        squad2: squad2Id,
        status,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
        bountyCoinAmount,
        matchType,
        applyLoserDeduction: true,
      });

      await newMatch.save();

      // Populate the match data
      const populatedMatch = await TournamentMatch.findById(newMatch._id)
        .populate("squad1", "name tag logo division currentBountyCoins level")
        .populate("squad2", "name tag logo division currentBountyCoins level")
        .lean();

      return reply.status(201).send({
        success: true,
        message: "Match created successfully",
        match: populatedMatch,
      });
    } catch (error) {
      console.error("Error creating match:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to create match",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Update match (admin only)
  fastify.put("/:matchId", async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };
      const updateData = request.body as any;

      const match = await TournamentMatch.findById(matchId);
      if (!match) {
        return reply.status(404).send({
          success: false,
          message: "Match not found",
        });
      }

      // Prevent updating completed matches
      if (match.status === "completed") {
        return reply.status(400).send({
          success: false,
          message: "Cannot update completed matches",
        });
      }

      // Validate squads if being updated
      if (updateData.squad1Id || updateData.squad2Id) {
        const squad1Id = updateData.squad1Id || match.squad1;
        const squad2Id = updateData.squad2Id || match.squad2;

        if (squad1Id === squad2Id) {
          return reply.status(400).send({
            success: false,
            message: "Squad 1 and Squad 2 cannot be the same",
          });
        }

        // Validate squads exist
        const [squad1, squad2] = await Promise.all([
          Squad.findById(squad1Id),
          Squad.findById(squad2Id),
        ]);

        if (!squad1 || !squad2) {
          return reply.status(404).send({
            success: false,
            message: "One or both squads not found",
          });
        }
      }

      // Update match
      const updatedMatch = await TournamentMatch.findByIdAndUpdate(
        matchId,
        {
          ...updateData,
          squad1: updateData.squad1Id || match.squad1,
          squad2: updateData.squad2Id || match.squad2,
          scheduledTime: updateData.scheduledTime
            ? new Date(updateData.scheduledTime)
            : match.scheduledTime,
        },
        { new: true, runValidators: true }
      )
        .populate("squad1", "name tag logo division currentBountyCoins level")
        .populate("squad2", "name tag logo division currentBountyCoins level")
        .lean();

      return reply.status(200).send({
        success: true,
        message: "Match updated successfully",
        match: updatedMatch,
      });
    } catch (error) {
      console.error("Error updating match:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to update match",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Update match status (admin only)
  fastify.put("/:matchId/status", async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };
      const { status } = request.body as { status: string };

      if (
        !status ||
        !["scheduled", "in_progress", "completed", "cancelled"].includes(status)
      ) {
        return reply.status(400).send({
          success: false,
          message:
            "Valid status is required (scheduled, in_progress, completed, cancelled)",
        });
      }

      const match = await TournamentMatch.findById(matchId);
      if (!match) {
        return reply.status(404).send({
          success: false,
          message: "Match not found",
        });
      }

      // Update status and timestamps
      const updateData: any = { status };

      if (status === "in_progress" && match.status === "scheduled") {
        updateData.startTime = new Date();
      } else if (status === "completed" && match.status === "in_progress") {
        updateData.endTime = new Date();
      }

      const updatedMatch = await TournamentMatch.findByIdAndUpdate(
        matchId,
        updateData,
        { new: true }
      )
        .populate("squad1", "name tag logo division currentBountyCoins level")
        .populate("squad2", "name tag logo division currentBountyCoins level")
        .lean();

      return reply.status(200).send({
        success: true,
        message: "Match status updated successfully",
        match: updatedMatch,
      });
    } catch (error) {
      console.error("Error updating match status:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to update match status",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Delete match (admin only)
  fastify.delete("/:matchId", async (request, reply) => {
    try {
      const { matchId } = request.params as { matchId: string };

      const match = await TournamentMatch.findById(matchId);
      if (!match) {
        return reply.status(404).send({
          success: false,
          message: "Match not found",
        });
      }

      // Prevent deleting completed matches
      if (match.status === "completed") {
        return reply.status(400).send({
          success: false,
          message: "Cannot delete completed matches",
        });
      }

      await TournamentMatch.findByIdAndDelete(matchId);

      return reply.status(200).send({
        success: true,
        message: "Match deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting match:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to delete match",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });

  // Get squads for tournament (for match creation)
  fastify.get("/tournament/:tournamentId/squads", async (request, reply) => {
    try {
      const { tournamentId } = request.params as { tournamentId: string };

      // Get all approved registrations for this tournament
      const registrations = await TournamentRegistration.find({
        tournament: tournamentId,
        status: "approved",
      }).populate("squad", "name tag logo division currentBountyCoins level");

      const squads = registrations.map((reg: any) => reg.squad);

      return reply.status(200).send({
        success: true,
        squads,
      });
    } catch (error) {
      console.error("Error getting tournament squads:", error);
      return reply.status(500).send({
        success: false,
        message: "Failed to get tournament squads",
      });
    }
  });
};

export default tournamentMatchRoutes;
