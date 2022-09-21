FROM scratch
COPY pkg/ebon-bot-x64 /ebb
USER 1000
CMD ["/ebb"]