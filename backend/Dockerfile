FROM golang:1.25-alpine3.22 AS base

WORKDIR /workspace
ENV CGO_ENABLED=0

COPY go.mod go.sum ./
RUN go mod download

FROM base AS development
COPY . .
EXPOSE 8080
CMD ["go", "run", "./cmd/api"]

FROM base AS test
COPY . .
CMD ["go", "test", "./..."]

FROM base AS build
ARG APP_VERSION=dev
COPY . .
RUN go test ./... && go build -trimpath -ldflags="-s -w -X main.version=${APP_VERSION}" -o /out/orgmind-api ./cmd/api

FROM scratch AS production
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=build /out/orgmind-api /orgmind-api
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/orgmind-api"]
