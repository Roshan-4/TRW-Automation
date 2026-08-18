FROM cypress/browsers:node18.18.0-chrome118-ff118

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run lint

RUN npx cypress verify

CMD ["npm", "run", "cypress:run"]
