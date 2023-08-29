import type { UserId } from '$/commonTypesWithClient/branded';
import axios from 'axios';

export const postRaspi = async (id: UserId | undefined) => {
  try {
    const response = await axios.post('http://localhost:31578/api/endpoint', { id });
    return response.data;
  } catch (error) {
    console.error('Error sending data to Raspi:', error);
    throw error;
  }
};
