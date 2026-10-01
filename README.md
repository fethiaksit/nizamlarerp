# Nizamlar Tekstil Baskı ERP

Yerel ağda çalışan, tekstil baskı işletmeleri için sade yönetim paneli.

## Başlatma

Docker Desktop kurulu bir bilgisayarda:

```bash
cp .env.example .env
docker compose up --build
```

- Arayüz: `http://localhost:5173`
- API sağlık denetimi: `http://localhost:8080/healthz`

İlk açılışta PostgreSQL şeması otomatik olarak oluşturulur. İlk sürüm yerel
ağdaki tek yönetici kullanımı içindir; giriş ekranı yoktur.

## Geliştirme kontrolleri

```bash
cd backend && go test ./...
cd frontend && npm test -- --run && npm run build
```

Docker bu geliştirme makinesinde kurulu olmadığı için Compose başlatması burada
çalıştırılamadı; yapılandırma, backend testleri ve frontend üretim derlemesi
doğrulandı.
