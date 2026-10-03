package settings

import (
	"context"
	"testing"
)

type repoStub struct{}

func (s *repoStub) Get(context.Context) (CompanySettings, error) {
	return CompanySettings{CompanyTitle: "Nizamlar"}, nil
}
func (s *repoStub) Update(_ context.Context, input CompanySettings) (CompanySettings, error) {
	return input, nil
}

func TestUpdateSettingsRequiresTitle(t *testing.T) {
	service := NewService(&repoStub{})
	_, err := service.Update(context.Background(), CompanySettings{CompanyTitle: "  "})
	if err == nil || err.Error() != "Firma unvanı zorunludur." {
		t.Fatalf("Update() error = %v, want title error", err)
	}
}
