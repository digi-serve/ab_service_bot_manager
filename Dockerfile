##
## digiserve/ab-bot-manager:[master/develop]
##
## This is our microservice for our running site to connect to a slack channel 
## (bot) and alert us of problems.
##
## Docker Commands:
## ---------------
## $ docker build -t digiserve/ab-bot-manager:[master/develop] .
## $ docker push digiserve/ab-bot-manager:[master/develop]
##

ARG BRANCH=master

FROM digiserve/service-cli:${BRANCH}

COPY . /app

WORKDIR /app

RUN npm i -f

CMD ["node", "--inspect=0.0.0.0:9229", "app.js"]
