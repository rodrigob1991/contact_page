FROM node:16
COPY src ./src
COPY yarn.lock ./
COPY package.json ./
COPY tsconfig.json ./
#COPY --from=chat /node_modules /node_modules
RUN mkdir "dist"
RUN yarn install
RUN yarn build
# If you are building your code for production
# RUN npm ci --only=production
EXPOSE 3000
CMD ["yarn", "dev"]