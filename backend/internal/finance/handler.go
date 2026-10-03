package finance

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(group *gin.RouterGroup, service *Service) {
	group.GET("/finance/accounts", func(c *gin.Context) {
		accounts, err := service.ListAccounts(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Kasa/Banka hesapları alınırken hata oluştu."})
			return
		}
		c.JSON(http.StatusOK, accounts)
	})

	group.POST("/finance/accounts", func(c *gin.Context) {
		var input CashBankAccount
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli hesap bilgileri girin."})
			return
		}
		account, err := service.CreateAccount(c.Request.Context(), input)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, account)
	})

	group.GET("/finance/transactions", func(c *gin.Context) {
		items, err := service.ListTransactions(c.Request.Context(), Filters{
			EntryType: c.Query("entry_type"),
			Category:  c.Query("category"),
			Search:    c.Query("search"),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Finans hareketleri alınırken hata oluştu."})
			return
		}
		c.JSON(http.StatusOK, items)
	})

	group.POST("/finance/transactions", func(c *gin.Context) {
		var input CreateFinanceInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli işlem bilgilerini girin."})
			return
		}
		item, err := service.CreateTransaction(c.Request.Context(), input)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, item)
	})
}
