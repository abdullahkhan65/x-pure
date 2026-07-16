import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { Env } from "../config/env.schema";

/**
 * Thin wrapper around a single ioredis connection. Reserved for what actually needs
 * Redis in this stack: auth rate-limiting today, BullMQ job queues (report generation,
 * notifications) as a documented future addition.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor(configService: ConfigService<Env, true>) {
    this.client = new Redis(configService.get("REDIS_URL", { infer: true }), {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
    });
  }

  async ping(): Promise<boolean> {
    const reply = await this.client.ping();
    return reply === "PONG";
  }

  async onModuleDestroy() {
    this.client.disconnect();
  }
}
