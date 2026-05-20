import app from './app.js';
import { config } from './config/index.js';

app.listen(config.PORT, () => {
  console.log(`[Server] Modular monolith running at: http://localhost:${config.PORT}`);
  console.log(`[Server] Environment: ${config.NODE_ENV}`);
});
