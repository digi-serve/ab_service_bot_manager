##
## digiserve/ab-bot-manager:develop
##
## This is our microservice for our running site to connect to a slack channel 
## (bot) and alert us of problems.
##
## Docker Commands:
## ---------------
## $ docker build -t digiserve/ab-bot-manager:develop .
## $ docker push digiserve/ab-bot-manager:develop
##

FROM digiserve/service-cli:develop

RUN git clone --recursive https://github.com/appdevdesigns/ab_service_bot_manager.git app && cd app && git checkout develop && npm install

WORKDIR /app

CMD [ "node", "--inspect=0.0.0.0:9229", "app.js" ]
