FROM node:16-alpine as builder
RUN mkdir /opt/workspace
WORKDIR /opt/workspace
COPY . .
RUN yarn \
  && yarn build

FROM node:16-alpine
LABEL maintainer="thezzisu (thezzisu@gmail.com)"
RUN mkdir /opt/workspace
WORKDIR /opt/workspace
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh
COPY --from=builder /opt/workspace/.nvmrc .
COPY --from=builder /opt/workspace/package.json .
COPY --from=builder /opt/workspace/build build
COPY --from=builder /opt/workspace/static static
RUN yarn --production
EXPOSE 8010
CMD [ "/opt/workspace/entrypoint.sh" ]