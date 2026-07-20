/** Punto de entrada: arranca el servidor HTTP. */
import { createApp } from "./app";
import { env } from "./config/env";
import { API_PREFIX } from "./config/constants";

const app = createApp();

app.listen(env.port, () => {
  console.log(`Reclutalia API escuchando en http://localhost:${env.port}${API_PREFIX}`);
});
