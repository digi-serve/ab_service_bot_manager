##
## digiserve/ab-bot-manager:master
##
## This is our microservice for our running site to connect to a slack channel 
## (bot) and alert us of problems.
##
## Docker Commands:
## ---------------
## $ docker build -t digiserve/ab-bot-manager:master .
## $ docker push digiserve/ab-bot-manager:master
##

FROM digiserve/service-cli:master

RUN git clone --recursive https://github.com/appdevdesigns/ab_service_bot_manager.git app && cd app && npm install

WORKDIR /app

CMD [ "node", "--inspect=0.0.0.0:9229", "app.js" ]
