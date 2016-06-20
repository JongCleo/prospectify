FROM node:argon

RUN apt-get update &&\
    apt-get install -y libgtk2.0-0 libgconf-2-4 \
    libasound2 libxtst6 libxss1 libnss3 xvfb

WORKDIR /app

RUN npm install nightmare
COPY cnn.js .

COPY entrypoint /
RUN chmod +x /entrypoint
ENTRYPOINT ["/entrypoint"]

CMD DEBUG=nightmare node app.js
