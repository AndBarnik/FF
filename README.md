# FF Messenger

Мессенджер для телефона (iOS/Android). Всё на бесплатных технологиях.

- `server/` — Node.js (≥ 22.13), Express, WebSocket, встроенный SQLite (без внешней БД).
- `mobile/` — React Native + Expo (Expo Go бесплатен).

## Запуск
```bash
cd server && npm install && npm start      # сервер на :3000
cd mobile && npm install && npm start      # откройте QR-код в Expo Go
```
На реальном телефоне в `mobile/app.json` замените `extra.apiUrl` на адрес компьютера
в локальной сети, например `http://192.168.1.10:3000`.
Для продакшена задайте `JWT_SECRET` и `DB_PATH` для сервера.

## Этапы
1. ✅ Вход, личные и групповые чаты, текстовые сообщения, realtime
2. Фото, видео, файлы, музыка
3. Голосовые сообщения, видеосообщения-кружки
4. Аудио- и видеозвонки
