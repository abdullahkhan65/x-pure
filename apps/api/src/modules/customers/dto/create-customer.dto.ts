import { createZodDto } from "nestjs-zod";
import { CreateCustomerSchema } from "@x-pure/types";

export class CreateCustomerDto extends createZodDto(CreateCustomerSchema) {}
