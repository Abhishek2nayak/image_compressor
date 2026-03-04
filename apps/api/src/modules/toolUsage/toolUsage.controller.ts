import { Request, Response, NextFunction } from 'express';
import { toolUsageService } from './toolUsage.service';

function getIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown'
  );
}

export const toolUsageController = {
  /** POST /api/v1/tools/check
   *  Body: { pageCount?, fileSizeMB? }
   *  Returns { allowed, reason?, used?, limit?, tier }
   */
  async check(req: Request, res: Response, next: NextFunction) {
    try {
      const { pageCount, fileSizeMB } = req.body as { pageCount?: number; fileSizeMB?: number };
      const result = await toolUsageService.check({
        userId:    req.user?.id,
        ipAddress: getIp(req),
        pageCount,
        fileSizeMB,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/tools/record
   *  Body: { tool, pageCount?, fileCount? }
   */
  async record(req: Request, res: Response, next: NextFunction) {
    try {
      const { tool, pageCount, fileCount } = req.body as {
        tool: string;
        pageCount?: number;
        fileCount?: number;
      };
      await toolUsageService.record({
        tool,
        userId:    req.user?.id,
        ipAddress: getIp(req),
        pageCount,
        fileCount,
      });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
