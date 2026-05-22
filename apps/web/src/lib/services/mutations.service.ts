import { Mutation, MutationRequest } from "@morphos/shared";
import { apiClient } from "../api-client";

export const mutationsService = {
  async list(appId?: string, status?: string) {
    const params = new URLSearchParams();
    if (appId) params.append("appId", appId);
    if (status) params.append("status", status);

    const response = await apiClient.get<Mutation[]>(
      `/api/mutations?${params.toString()}`
    );
    return response.data;
  },

  async get(id: string) {
    const response = await apiClient.get<Mutation>(`/api/mutations/${id}`);
    return response.data;
  },

  async create(data: Partial<Mutation>) {
    const response = await apiClient.post<Mutation>("/api/mutations", data);
    return response.data;
  },

  async update(id: string, data: Partial<Mutation>) {
    const response = await apiClient.patch<Mutation>(`/api/mutations/${id}`, data);
    return response.data;
  },

  async apply(id: string) {
    const response = await apiClient.post<Mutation>(
      `/api/mutations/${id}/apply`
    );
    return response.data;
  },

  async rollback(id: string) {
    const response = await apiClient.post<Mutation>(
      `/api/mutations/${id}/rollback`
    );
    return response.data;
  },

  async suggestMutations(appId: string, objective: string) {
    const response = await apiClient.post<MutationRequest[]>(
      "/api/mutations/suggest",
      { appId, objective }
    );
    return response.data;
  },
};
