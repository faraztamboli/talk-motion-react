# TalkMotion overlay for the shared multi-site nginx image (farukh/web).
#
# BASE is the full image built by docker-images/web/Dockerfile (all sites). This
# replaces only app.talk-motion.com and talk-motion.com, so a TalkMotion release
# never ships whatever happens to be on disk for the other sites, and the layer
# count stays fixed instead of growing with every deploy.
#
# Built by scripts/deploy.mjs with the build context set to the folder that holds
# dist/ and "Landing Page/dist/".
ARG BASE=farukh/web:12.2.2-ubuntu20.04
FROM ${BASE}

RUN rm -rf /var/www/app.talk-motion.com/html /var/www/talk-motion.com/html
COPY ["dist/", "/var/www/app.talk-motion.com/html/"]
COPY ["Landing Page/dist/", "/var/www/talk-motion.com/html/"]
