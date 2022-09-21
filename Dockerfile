FROM scratch
ARG file
COPY pkg/$file /ebb
USER 1000
CMD ["/ebb"]