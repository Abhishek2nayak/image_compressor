import { prisma } from '../../config/database';

// ── Tier limits ───────────────────────────────────────────────────────────────

const LIMITS = {
  GUEST:      { operations: 3,        pages: 15,        fileSizeMB: 10  },
  FREE:       { operations: 20,       pages: 50,        fileSizeMB: 25  },
  PRO:        { operations: Infinity, pages: Infinity,  fileSizeMB: 100 },
  ENTERPRISE: { operations: Infinity, pages: Infinity,  fileSizeMB: 500 },
} as const;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Check ─────────────────────────────────────────────────────────────────────

export interface CheckParams {
  userId?: string;
  ipAddress?: string;
  pageCount?: number;
  fileSizeMB?: number;
}

export interface CheckResult {
  allowed: boolean;
  reason?: string;
  used?: number;
  limit?: number;
  tier?: string;
}

export const toolUsageService = {
  async check({ userId, ipAddress, pageCount = 0, fileSizeMB = 0 }: CheckParams): Promise<CheckResult> {
    const today = startOfToday();

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } });
      const tier = (user?.tier ?? 'FREE') as keyof typeof LIMITS;
      const lim  = LIMITS[tier];

      if (fileSizeMB > lim.fileSizeMB) {
        return { allowed: false, reason: `Your plan supports files up to ${lim.fileSizeMB} MB`, tier };
      }
      if (pageCount > lim.pages) {
        return { allowed: false, reason: `Your plan supports up to ${lim.pages} pages per operation`, tier };
      }
      if (lim.operations === Infinity) {
        return { allowed: true, used: 0, limit: -1, tier };
      }

      const used = await prisma.toolUsage.count({ where: { userId, createdAt: { gte: today } } });
      if (used >= lim.operations) {
        return {
          allowed: false,
          reason: `Daily limit of ${lim.operations} operations reached. Upgrade to Pro for unlimited access.`,
          used,
          limit: lim.operations,
          tier,
        };
      }

      return { allowed: true, used, limit: lim.operations, tier };
    }

    // Guest — limit by IP
    const lim = LIMITS.GUEST;
    if (fileSizeMB > lim.fileSizeMB) {
      return { allowed: false, reason: `Sign up free to process files larger than ${lim.fileSizeMB} MB`, tier: 'GUEST' };
    }
    if (pageCount > lim.pages) {
      return { allowed: false, reason: `Sign up free to process more than ${lim.pages} pages`, tier: 'GUEST' };
    }

    const ip    = ipAddress ?? 'unknown';
    const used  = await prisma.toolUsage.count({ where: { ipAddress: ip, userId: null, createdAt: { gte: today } } });
    if (used >= lim.operations) {
      return {
        allowed: false,
        reason: `Daily limit reached. Sign up free for ${LIMITS.FREE.operations} operations/day.`,
        used,
        limit:  lim.operations,
        tier:   'GUEST',
      };
    }

    return { allowed: true, used, limit: lim.operations, tier: 'GUEST' };
  },

  // ── Record ──────────────────────────────────────────────────────────────────

  async record(params: {
    tool: string;
    userId?: string;
    ipAddress?: string;
    pageCount?: number;
    fileCount?: number;
  }) {
    await prisma.toolUsage.create({
      data: {
        tool:      params.tool,
        userId:    params.userId ?? null,
        ipAddress: params.ipAddress ?? null,
        pageCount: params.pageCount ?? 0,
        fileCount: params.fileCount ?? 1,
      },
    });
  },
};
