FROM scratch
COPY pkg/ebon-bot-arm64 /ebb
USER 1000
CMD ["/ebb"]