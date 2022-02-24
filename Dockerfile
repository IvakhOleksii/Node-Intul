FROM node:16.13.1-alpine

COPY . /usr/src/inTulsa-be
COPY package-lock.json /usr/src/inTulsa-be

WORKDIR /usr/src/inTulsa-be

ENV GOOGLE_APPLICATION_CREDENTIALS=/opt/intulsa/src/config/service-account-file.json

RUN apk update && apk --no-cache add --virtual native-deps g++ make cmake python3
    
RUN npm install

RUN apk del native-deps

RUN npm run build

EXPOSE 5000

CMD ["npm", "run", "dev"]
