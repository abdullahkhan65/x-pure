import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, HealthIndicatorFunction } from "@nestjs/terminus";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { Public } from "../common/decorators/public.decorator";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    const checkDatabase: HealthIndicatorFunction = async () => {
      await this.prisma.client.$queryRaw`SELECT 1`;
      return { database: { status: "up" } };
    };

    const checkRedis: HealthIndicatorFunction = async () => {
      const ok = await this.redis.ping();
      if (!ok) return { redis: { status: "down" } };
      return { redis: { status: "up" } };
    };

    return this.health.check([checkDatabase, checkRedis]);
  }
}
