import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DebugLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DebugLoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log(`[Incoming Request] ${req.method} ${req.originalUrl}`);
    this.logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
    this.logger.debug(`Content-Length: ${req.get('content-length')}`);
    this.logger.debug(`Content-Type: ${req.get('content-type')}`);

    next();
  }
}
