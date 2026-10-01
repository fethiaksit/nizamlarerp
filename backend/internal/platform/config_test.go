package platform

import (
	"strings"
	"testing"
)

func TestLoadConfigRejectsMissingDatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "")

	_, err := LoadConfig()

	if err == nil {
		t.Fatal("LoadConfig() error = nil, veritabanı bağlantı bilgisi için hata bekleniyordu")
	}
	if !strings.Contains(err.Error(), "Veritabanı bağlantı bilgisi eksik.") {
		t.Fatalf("LoadConfig() error = %q, Türkçe veritabanı hata mesajı bekleniyordu", err)
	}
}
