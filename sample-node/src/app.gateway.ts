import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayInit,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { subscribeOn } from 'rxjs-compat/operator/subscribeOn';

  @WebSocketGateway({ cors: true })
  export class AppGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    private logger: Logger = new Logger('AppGateway');

    afterInit(server: Server) {
      this.logger.log('Init');
    }

    handleDisconnect(client: Socket) {
      this.logger.log(`Client disconnected: ${client.id}`);
    }

    handleConnection(client: Socket, ...args: any[]) {
      this.logger.log(`Client connected_: ${client.id}`);
    }
}
