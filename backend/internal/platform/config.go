package platform

import (
	"errors"
	"os"
)

// Config contains the runtime settings supplied by the environment.
type Config struct {
	Port           string
	DatabaseURL    string
	FrontendOrigin string
}

func LoadConfig() (Config, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return Config{}, errors.New("Veritabanı bağlantı bilgisi eksik.")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	frontendOrigin := os.Getenv("FRONTEND_ORIGIN")
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:5173"
	}

	return Config{Port: port, DatabaseURL: databaseURL, FrontendOrigin: frontendOrigin}, nil
}
