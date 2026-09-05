import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,

    // Allows other devices on your network to open the admin site,
    // which is useful when demonstrating on a second laptop.
    host: true,
  },
});
