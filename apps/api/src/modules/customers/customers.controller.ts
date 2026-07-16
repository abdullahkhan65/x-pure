import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, UseInterceptors } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { QueryCustomersDto } from "./dto/query-customers.dto";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Auditable } from "../../common/decorators/auditable.decorator";
import { AuditLogInterceptor } from "../../common/interceptors/audit-log.interceptor";
import type { AuthenticatedUser } from "../../common/types/authenticated-user";
import { permissionCode } from "@x-pure/types";

@ApiTags("customers")
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermission(permissionCode("customers", "VIEW"))
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryCustomersDto) {
    return this.customersService.list(user.companyId, query);
  }

  @Get("export")
  @RequirePermission(permissionCode("customers", "EXPORT"))
  @Header("Content-Type", "text/csv")
  @Header("Content-Disposition", 'attachment; filename="customers.csv"')
  exportCsv(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.exportCsv(user.companyId);
  }

  @Get(":id")
  @RequirePermission(permissionCode("customers", "VIEW"))
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.customersService.findOne(user.companyId, id);
  }

  @Post()
  @RequirePermission(permissionCode("customers", "CREATE"))
  @Auditable("CUSTOMER_CREATED")
  @UseInterceptors(AuditLogInterceptor)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.companyId, user.branchId, dto);
  }

  @Patch(":id")
  @RequirePermission(permissionCode("customers", "EDIT"))
  @Auditable("CUSTOMER_UPDATED")
  @UseInterceptors(AuditLogInterceptor)
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(user.companyId, id, dto);
  }

  @Delete(":id")
  @RequirePermission(permissionCode("customers", "DELETE"))
  @Auditable("CUSTOMER_DELETED")
  @UseInterceptors(AuditLogInterceptor)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    await this.customersService.softDelete(user.companyId, id);
    return { id, deleted: true };
  }
}
