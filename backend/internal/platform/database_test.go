package platform

import (
	"context"
	"testing"
)

func TestOpenDatabaseRejectsInvalidConnectionURL(t *testing.T) {
	_, err := OpenDatabase(context.Background(), Config{DatabaseURL: "://gecersiz"})

	if err == nil {
		t.Fatal("OpenDatabase() error = nil, geçersiz bağlantı adresi için hata bekleniyordu")
	}
}
