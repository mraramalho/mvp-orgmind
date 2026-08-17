package config

import "testing"

func TestLoadUsesDefaults(t *testing.T) {
	t.Setenv("APP_PORT", "")
	t.Setenv("APP_VERSION", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() returned an error: %v", err)
	}

	if cfg.Port != "8080" {
		t.Fatalf("Port = %q, want %q", cfg.Port, "8080")
	}

	if cfg.Version != "dev" {
		t.Fatalf("Version = %q, want %q", cfg.Version, "dev")
	}
}

func TestLoadReadsEnvironment(t *testing.T) {
	t.Setenv("APP_PORT", "9090")
	t.Setenv("APP_VERSION", "test-version")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() returned an error: %v", err)
	}

	if cfg.Port != "9090" || cfg.Version != "test-version" {
		t.Fatalf("Load() = %#v, want configured values", cfg)
	}
}
