import { createZodDto } from "nestjs-zod";
import { LoginSchema } from "@x-pure/types";

export class LoginDto extends createZodDto(LoginSchema) {}
