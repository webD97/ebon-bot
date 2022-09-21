ARG file

FROM scratch
COPY pkg/$file /ebb
USER 1000
CMD ["/ebb"]