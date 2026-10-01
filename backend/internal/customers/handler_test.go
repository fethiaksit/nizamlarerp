package customers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func TestCreateCustomerEndpointReturnsTurkishValidationError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	service := NewService(&customerRepositoryStub{}, ledgerReaderStub{})
	RegisterRoutes(router.Group("/api/v1"), service)

	request := httptest.NewRequest(http.MethodPost, "/api/v1/customers", bytes.NewBufferString(`{"company_name":""}`))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("POST /customers status = %d, want %d", response.Code, http.StatusBadRequest)
	}
	if response.Body.String() != `{"message":"Firma adı zorunludur."}` {
		t.Fatalf("POST /customers body = %s", response.Body.String())
	}
}

func TestCustomerDetailEndpointReturnsLedgerBalance(t *testing.T) {
	gin.SetMode(gin.TestMode)
	customerID := uuid.New()
	router := gin.New()
	service := NewService(&customerRepositoryStub{customer: Customer{ID: customerID, CompanyName: "ABC Tekstil"}}, ledgerReaderStub{balance: "184500.00"})
	RegisterRoutes(router.Group("/api/v1"), service)

	request := httptest.NewRequest(http.MethodGet, "/api/v1/customers/"+customerID.String(), nil)
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("GET /customers/:id status = %d, want %d", response.Code, http.StatusOK)
	}
	if !bytes.Contains(response.Body.Bytes(), []byte(`"open_balance":"184500.00"`)) {
		t.Fatalf("GET /customers/:id body = %s, want balance", response.Body.String())
	}
}
