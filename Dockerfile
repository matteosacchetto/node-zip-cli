FROM node:16.15-alpine as build

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./package*.json ./

# Install dependencies
RUN npm ci

# Copy code
COPY ./ ./

# Test app
RUN npm test

# Bundle app source to single file
RUN npm run build

FROM node:16.15-alpine as deploy

# Create app directory
WORKDIR /usr/src/app

# Set the environment to
ENV NODE_ENV production

# Copy built file
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./

# Install production dependencies
RUN npm ci --only=production

CMD [ "node", "." ]