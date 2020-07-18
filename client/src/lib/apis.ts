import apiGenerator from 'apis';
import { fetchFunction } from './isofetch';

export const fetchApi = apiGenerator(fetchFunction);
export default fetchApi;
