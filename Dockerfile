FROM node:4
RUN npm install -q -g gulp karma karma-cli webpack

RUN groupadd -r node \
    &&  useradd -r -m -g node node

ADD . /usr/src/app
RUN chown -R node:node /usr/src/app
USER node
WORKDIR /usr/src/app
RUN npm install -q
ENV PORT 3000  
CMD [ "gulp", "serve" ]
EXPOSE 3000
