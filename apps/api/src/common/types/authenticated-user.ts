/** Shape of `request.user` after JwtStrategy.validate — mirrors the JWT's minimal claims. */
export interface AuthenticatedUser {
  id: string;
  companyId: string;
  branchId: string | null;
  roleId: string;
}
