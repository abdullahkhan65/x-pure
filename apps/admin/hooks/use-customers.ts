"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCustomerInput, CustomerQuery, CustomerResponse, UpdateCustomerInput } from "@x-pure/types";
import { apiFetch } from "@/lib/api-client";

interface PaginatedCustomers {
  items: CustomerResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function buildQueryString(query: Partial<CustomerQuery>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useCustomers(query: Partial<CustomerQuery>) {
  return useQuery({
    queryKey: ["customers", query],
    queryFn: () => apiFetch<PaginatedCustomers>(`/customers${buildQueryString(query)}`),
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => apiFetch<CustomerResponse>(`/customers/${id}`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      apiFetch<CustomerResponse>("/customers", { method: "POST", body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomerInput) =>
      apiFetch<CustomerResponse>(`/customers/${id}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
