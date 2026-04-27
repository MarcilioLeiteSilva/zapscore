import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiFootballService } from '../integrations/api-football/api-football.service';

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apiFootball: ApiFootballService,
  ) {}

  async getPlayerDetails(externalId: number, season: number = 2026) {
    // 1. Check if we have the player in our database
    const cachedPlayer = await this.prisma.player.findUnique({
      where: { externalId },
    });

    // 2. If we have it and it's fresh (e.g., updated in the last 24h), return it
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (cachedPlayer && cachedPlayer.updatedAt > oneDayAgo) {
      return this.formatPlayerResponse(cachedPlayer);
    }

    // 3. Otherwise, fetch from API-Football
    try {
      this.logger.log(`Fetching player ${externalId} for season ${season} from API-Football`);
      const apiResponse = await this.apiFootball.getPlayer({ id: externalId, season });
      
      if (!apiResponse || apiResponse.length === 0) {
        return cachedPlayer ? this.formatPlayerResponse(cachedPlayer) : null;
      }

      const playerData = apiResponse[0].player;
      const statistics = apiResponse[0].statistics;

      // 4. Upsert into our database
      const upsertedPlayer = await this.prisma.player.upsert({
        where: { externalId },
        update: {
          name: playerData.name,
          firstname: playerData.firstname,
          lastname: playerData.lastname,
          age: playerData.age,
          birthDate: playerData.birth.date,
          birthPlace: playerData.birth.place,
          birthCountry: playerData.birth.country,
          nationality: playerData.nationality,
          height: playerData.height,
          weight: playerData.weight,
          injured: playerData.injured,
          photo: playerData.photo,
          statisticsJson: JSON.stringify(statistics),
        },
        create: {
          externalId: playerData.id,
          name: playerData.name,
          firstname: playerData.firstname,
          lastname: playerData.lastname,
          age: playerData.age,
          birthDate: playerData.birth.date,
          birthPlace: playerData.birth.place,
          birthCountry: playerData.birth.country,
          nationality: playerData.nationality,
          height: playerData.height,
          weight: playerData.weight,
          injured: playerData.injured,
          photo: playerData.photo,
          statisticsJson: JSON.stringify(statistics),
        },
      });

      return this.formatPlayerResponse(upsertedPlayer);
    } catch (error) {
      this.logger.error(`Error fetching player ${externalId}: ${error.message}`);
      return cachedPlayer ? this.formatPlayerResponse(cachedPlayer) : null;
    }
  }

  private formatPlayerResponse(player: any) {
    return {
      ...player,
      statistics: player.statisticsJson ? JSON.parse(player.statisticsJson) : [],
    };
  }
}
