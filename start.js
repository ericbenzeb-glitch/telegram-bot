import './bot.js';
import app from './webapp-server.js';
import { WEBAPP_BACKEND_ORIGIN } from './config.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WebApp Server läuft auf Port ${PORT}`);
  if (WEBAPP_BACKEND_ORIGIN) console.log(`Backend Origin: ${WEBAPP_BACKEND_ORIGIN}`);
});
