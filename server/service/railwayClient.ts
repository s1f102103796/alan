import { ApolloClient, InMemoryCache } from '@apollo/client';
import { RAILWAY_TOKEN } from './envValues';

export const railwayClient = new ApolloClient({
  uri: 'https://backboard.railway.app/graphql/v2',
  cache: new InMemoryCache(),
  headers: { Authorization: `Bearer ${RAILWAY_TOKEN}` },
});
