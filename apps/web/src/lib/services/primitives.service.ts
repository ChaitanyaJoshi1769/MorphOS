import { Primitive } from "@morphos/shared";
import { apiClient } from "../api-client";

export const primitivesService = {
  async list(appId?: string, category?: string) {
    const params = new URLSearchParams();
    if (appId) params.append("appId", appId);
    if (category) params.append("category", category);

    const response = await apiClient.get<Primitive[]>(
      `/api/primitives?${params.toString()}`
    );
    return response.data;
  },

  async get(id: string) {
    const response = await apiClient.get<Primitive>(`/api/primitives/${id}`);
    return response.data;
  },

  async register(primitive: Primitive) {
    const response = await apiClient.post<Primitive>("/api/primitives", primitive);
    return response.data;
  },

  async update(id: string, data: Partial<Primitive>) {
    const response = await apiClient.patch<Primitive>(`/api/primitives/${id}`, data);
    return response.data;
  },

  async search(query: string) {
    const response = await apiClient.get<Primitive[]>(
      `/api/primitives/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },
};
