import { UserProfile } from "@morphos/shared";
import { apiClient } from "../api-client";

export const personalizationService = {
  async getProfile(userId: string) {
    const response = await apiClient.get<UserProfile>(
      `/api/personalization/profiles/${userId}`
    );
    return response.data;
  },

  async recordActivity(userId: string, activity: Record<string, unknown>) {
    const response = await apiClient.post(
      `/api/personalization/${userId}/activity`,
      activity
    );
    return response.data;
  },

  async getRecommendations(userId: string) {
    const response = await apiClient.get(
      `/api/personalization/${userId}/recommendations`
    );
    return response.data;
  },

  async updatePreferences(userId: string, preferences: Record<string, unknown>) {
    const response = await apiClient.patch(
      `/api/personalization/${userId}/preferences`,
      preferences
    );
    return response.data;
  },
};
