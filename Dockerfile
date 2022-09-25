FROM docker.io/node:16-alpine

COPY node_modules/ /opt/ebb/node_modules
COPY dist/*.js /opt/ebb/dist/

USER 1000
CMD ["/opt/ebb/dist/index.js"]
