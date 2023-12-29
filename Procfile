# Procfile

# This is executed during the release phase before the app is restarted
release: sudo npm install -g @nestjs/cli && npm install && npx prisma generate

# This is executed to start your NestJS application
web: sudo npm start
