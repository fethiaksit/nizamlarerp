package jobs

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCreateJobEndpointRejectsMissingCustomer(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	RegisterRoutes(router.Group("/api/v1"), NewService(&repositoryStub{}))
	request := httptest.NewRequest(http.MethodPost, "/api/v1/jobs", bytes.NewBufferString(`{"job_number":"IS-001"}`))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	if response.Code != http.StatusBadRequest || response.Body.String() != `{"message":"Müşteri seçin."}` {
		t.Fatalf("POST /jobs response = %d %s", response.Code, response.Body.String())
	}
}
