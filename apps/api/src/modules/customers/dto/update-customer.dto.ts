import { createZodDto } from "nestjs-zod";
import { UpdateCustomerSchema } from "@x-pure/types";

export class UpdateCustomerDto extends createZodDto(UpdateCustomerSchema) {}
