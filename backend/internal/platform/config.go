package platform

import (
	"errors"
	"os"
)

// Config contains the runtime settings supplied by the environment.
type Config struct {
	Port                 string
	DatabaseURL          string
	FrontendOrigin       string
	AuthSecret           string
	InitialAdminUsername string
	InitialAdminEmail    string
	InitialAdminPassword string
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

	authSecret := os.Getenv("AUTH_SECRET")
	if authSecret == "" {
		authSecret = "nizamlar-tekstil-erp-jwt-secret-key-development-2026"
	}

	initialAdminUsername := os.Getenv("INITIAL_ADMIN_USERNAME")
	if initialAdminUsername == "" {
		initialAdminUsername = "admin"
	}

	initialAdminEmail := os.Getenv("INITIAL_ADMIN_EMAIL")
	if initialAdminEmail == "" {
		initialAdminEmail = "admin@nizamlar.com"
	}

	initialAdminPassword := os.Getenv("INITIAL_ADMIN_PASSWORD")

	return Config{
		Port:                 port,
		DatabaseURL:          databaseURL,
		FrontendOrigin:       frontendOrigin,
		AuthSecret:           authSecret,
		InitialAdminUsername: initialAdminUsername,
		InitialAdminEmail:    initialAdminEmail,
		InitialAdminPassword: initialAdminPassword,
	}, nil
}
