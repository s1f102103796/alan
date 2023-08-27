import { GOURMETAPI } from '$/service/envValues';
import axios from 'axios';

export async function fetchGourmetData() {
  try {
    const url = `http://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${GOURMETAPI}&large_area=Z011&middle_area=`;
    const response = await axios.get(url);
    const data = response.data;
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}
