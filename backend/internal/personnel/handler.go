package personnel

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterRoutes(group *gin.RouterGroup, service *Service) {
	group.GET("/personnel", func(c *gin.Context) {
		items, err := service.List(c.Request.Context(), c.Query("search"))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Personeller alınırken sorun oluştu."})
			return
		}
		c.JSON(http.StatusOK, items)
	})

	group.GET("/personnel/:id", func(c *gin.Context) {
		id, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçersiz personel ID."})
			return
		}
		p, err := service.Get(c.Request.Context(), id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Personel bulunamadı."})
			return
		}
		c.JSON(http.StatusOK, p)
	})

	group.POST("/personnel", func(c *gin.Context) {
		var input CreatePersonnelInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli personel bilgileri girin."})
			return
		}
		p, err := service.Create(c.Request.Context(), input)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, p)
	})

	group.POST("/personnel/:id/payments", func(c *gin.Context) {
		id, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçersiz personel ID."})
			return
		}
		var input CreatePaymentInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Geçerli ödeme bilgileri girin."})
			return
		}
		input.PersonnelID = id
		ph, err := service.CreatePayment(c.Request.Context(), input)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, ph)
	})
}
