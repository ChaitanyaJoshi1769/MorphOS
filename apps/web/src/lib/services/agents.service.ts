import { Agent, AgentTask } from "@morphos/shared";
import { apiClient } from "../api-client";

export const agentsService = {
  async list() {
    const response = await apiClient.get<Agent[]>("/api/agents");
    return response.data;
  },

  async get(id: string) {
    const response = await apiClient.get<Agent>(`/api/agents/${id}`);
    return response.data;
  },

  async createTask(agentId: string, task: Partial<AgentTask>) {
    const response = await apiClient.post<AgentTask>(
      `/api/agents/${agentId}/tasks`,
      task
    );
    return response.data;
  },

  async getTask(agentId: string, taskId: string) {
    const response = await apiClient.get<AgentTask>(
      `/api/agents/${agentId}/tasks/${taskId}`
    );
    return response.data;
  },

  async getMetrics(agentId: string) {
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/agents/${agentId}/metrics`
    );
    return response.data;
  },
};
