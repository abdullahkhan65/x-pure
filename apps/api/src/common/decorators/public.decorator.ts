import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/** Marks a route as skipping JwtAuthGuard entirely (e.g. login, health check). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
