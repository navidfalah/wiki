import { createApp } from './app';
import { BACKEND_API_URL, PORT, PUBLIC_API_URL } from './config';

const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`wiki-frontend listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`  BACKEND_API_URL (server-side fetches): ${BACKEND_API_URL}`);
  // eslint-disable-next-line no-console
  console.log(`  PUBLIC_API_URL (embedded for the browser): ${PUBLIC_API_URL}`);
});
