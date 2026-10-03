package customers

import (
	"errors"
	"net/http"

	"github.com/fethiaksit/nizamlar-erp/backend/internal/ledger"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterRoutes(group *gin.RouterGroup, service *Service) {
	group.POST("/customers", func(c *gin.Context) {
		var input CreateCustomerInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli müşteri bilgilerini girin."})
			return
		}
		customer, err := service.CreateCustomer(c.Request.Context(), input)
		respondCustomerError(c, err)
		if err == nil {
			c.JSON(http.StatusCreated, customer)
		}
	})

	group.GET("/customers", func(c *gin.Context) {
		items, err := service.ListCustomers(c.Request.Context(), c.Query("search"))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Müşteriler alınırken bir sorun oluştu."})
			return
		}
		c.JSON(http.StatusOK, items)
	})

	group.GET("/customers/:id", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}
		detail, err := service.GetCustomerDetail(c.Request.Context(), id)
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Müşteri bulunamadı."})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Müşteri bilgileri alınırken bir sorun oluştu."})
			return
		}
		c.JSON(http.StatusOK, detail)
	})

	group.PATCH("/customers/:id", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}
		var input UpdateCustomerInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli müşteri bilgilerini girin."})
			return
		}
		customer, err := service.UpdateCustomer(c.Request.Context(), id, input)
		respondCustomerError(c, err)
		if err == nil {
			c.JSON(http.StatusOK, customer)
		}
	})

	group.GET("/customers/:id/transactions", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}
		transactions, err := service.Transactions(c.Request.Context(), id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Hesap hareketleri alınırken bir sorun oluştu."})
			return
		}
		c.JSON(http.StatusOK, transactions)
	})

	group.POST("/customers/:id/transactions", func(c *gin.Context) {
		id, ok := parseID(c)
		if !ok {
			return
		}
		var input ledger.CreateTransactionInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli işlem bilgilerini girin."})
			return
		}
		transaction, err := service.AddTransaction(c.Request.Context(), id, input)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, transaction)
	})

	group.POST("/customers/:id/transactions/:txId/reverse", func(c *gin.Context) {
		txID, err := uuid.Parse(c.Param("txId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçersiz işlem kaydı."})
			return
		}
		if err := service.ReverseTransaction(c.Request.Context(), txID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "İşlem iptal edildi."})
	})
}

func parseID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli müşteri seçin."})
		return uuid.Nil, false
	}
	return id, true
}

func respondCustomerError(c *gin.Context, err error) {
	if err == nil {
		return
	}
	if err.Error() == "Firma adı zorunludur." || err.Error() == "Bu firma adıyla kayıt zaten var." {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"message": "Müşteri kaydedilirken bir sorun oluştu."})
}
