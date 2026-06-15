import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: '/fixtures',
  cors: {
    origin: '*',
  },
})
export class FixturesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(FixturesGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinFixture')
  handleJoinFixture(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { fixtureId: string },
  ) {
    if (!data || !data.fixtureId) {
      this.logger.warn(`Client ${client.id} tried to join fixture without fixtureId`);
      return { status: 'error', message: 'Missing fixtureId' };
    }
    const roomName = `fixture_${data.fixtureId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room ${roomName}`);
    return { status: 'success', joined: roomName };
  }

  @SubscribeMessage('joinLeague')
  handleJoinLeague(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { leagueId: number },
  ) {
    if (!data || !data.leagueId) {
      this.logger.warn(`Client ${client.id} tried to join league without leagueId`);
      return { status: 'error', message: 'Missing leagueId' };
    }
    const roomName = `league_${data.leagueId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined room ${roomName}`);
    return { status: 'success', joined: roomName };
  }

  emitFixtureUpdate(fixtureId: string, data: any) {
    const roomName = `fixture_${fixtureId}`;
    this.logger.log(`Emitting fixtureUpdate to room ${roomName}`);
    this.server.to(roomName).emit('fixtureUpdate', data);
  }

  emitLeagueUpdate(leagueId: number, data: any) {
    const roomName = `league_${leagueId}`;
    this.logger.log(`Emitting leagueUpdate to room ${roomName}`);
    this.server.to(roomName).emit('leagueUpdate', data);
  }
}
