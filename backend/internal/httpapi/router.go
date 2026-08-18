package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type healthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
}

func NewRouter(version string) http.Handler {
	router := chi.NewRouter()
	router.Get("/health", healthHandler(version))

	return router
}

func healthHandler(version string) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(healthResponse{Status: "ok", Version: version})
	}
}
