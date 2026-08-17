package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Port    string
	Version string
}

func Load() (Config, error) {
	port := valueOrDefault("APP_PORT", "8080")
	version := valueOrDefault("APP_VERSION", "dev")

	if strings.ContainsAny(port, " \t\r\n") || port == "" {
		return Config{}, fmt.Errorf("APP_PORT must be a non-empty port number")
	}

	return Config{Port: port, Version: version}, nil
}

func valueOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}

	return fallback
}
