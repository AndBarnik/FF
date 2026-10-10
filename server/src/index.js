import { createApp } from './app.js';

const port = process.env.PORT || 3000;
createApp().server.listen(port, () => console.log(`Messenger server on :${port}`));
