import axios from 'axios';

export const postRaspi = async (id: string) => {
  console.log('aaaa');
  console.log('Sending data to Raspi:', id);
  try {
    const response = await axios.post('http://localhost:31578/api/endpoint', { id });
    console.log('Response from Raspi:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending data to Raspi:', error);
    throw error;
  }
};
