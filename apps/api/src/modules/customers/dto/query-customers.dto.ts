import { createZodDto } from "nestjs-zod";
import { CustomerQuerySchema } from "@x-pure/types";

export class QueryCustomersDto extends createZodDto(CustomerQuerySchema) {}
