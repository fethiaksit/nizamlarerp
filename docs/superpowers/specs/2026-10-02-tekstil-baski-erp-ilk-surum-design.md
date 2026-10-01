# Tekstil Baskı ERP — İlk Sürüm Tasarımı

## Amaç ve kapsam

Bu ilk sürüm, yaklaşık 15 çalışanlı tekstil baskı işletmesinin yönetici/ofis
kullanımı için sade ve hızlı bir yönetim paneli sağlar. Sistem kullanıcının
mevcut çalışma biçimine uyum sağlar; üretim çalışanları için ayrı ekran veya
kullanıcı hesabı bu kapsamda yoktur.

İlk teslimat şunları içerir:

- Yerel ağda çalışabilen React, Go ve PostgreSQL uygulaması.
- Ana Sayfa, Müşteriler ve İşler ekranları.
- Gerçek REST API üzerinden veri okuyan/yazan responsive Türkçe arayüz.
- Müşteri bakiyesinin finansal hareketlerden hesaplanabildiği temel defter
  altyapısı.
- PostgreSQL migration ve yerel Docker Compose kurulumu.

Çekler, tahsilatlar, ödemeler, personel, gelir/gider ve gelişmiş raporlar
sonraki sürümlere ayrılır. İlk sürümdeki veri modeli, bu modüller eklendiğinde
müşteri bakiyesini elle yönetmeye ihtiyaç bırakmayacak şekilde tasarlanır.

## Çalışma ve dağıtım modeli

Uygulama önce yerel ağda çalışacaktır. Docker Compose PostgreSQL, API ve
arayüz bileşenlerini birlikte başlatır. Bağlantı bilgileri ve ortam ayarları
ortam değişkenleriyle sağlanır; böylece daha sonra aynı bileşenler bir sunucuya
taşınabilir.

İlk sürüm tek yönetici kullanıcısına odaklanır. `users` tablosu ve oturum
katmanı, daha sonra çoklu kullanıcı ve rol desteğinin eklenmesine uygun
tutulur; ancak ilk sürüm rol yönetim ekranı içermez.

## Mimari

```text
Tarayıcı
  │
  ├── React + TypeScript arayüzü (frontend/)
  │       │ REST /api/v1
  │
  └── Go + Gin API (backend/)
          ├── HTTP handler: istek/yanıt, Türkçe doğrulama hataları
          ├── service: iş kuralları ve transaction sınırları
          ├── repository: PostgreSQL sorguları
          └── migration: şema sürümleri
                  │
             PostgreSQL
```

Backend modülleri `customers`, `jobs`, `ledger` ve `dashboard` olarak ayrılır.
Her modül yalnızca kendi HTTP uçlarını, iş kurallarını ve kalıcılık kodunu
içerir. Dashboard salt-okunur toplulaştırma sorguları kullanır; müşteri veya iş
tablosunda elle güncellenen özet sayılara dayanmaz.

Frontend, sayfa ve ortak bileşenleri ayırır. Sunucu durumları API istemcisi
üzerinden yönetilir; boş, yükleniyor ve hata durumları kullanıcıya Türkçe ve
anlaşılır biçimde gösterilir.

## Veri modeli

Tüm ana tablolarda `created_at` ve `updated_at` alanları bulunur. Para
alanları PostgreSQL `NUMERIC(14,2)` ile tutulur; uygulama katmanında float
kullanılmaz. Başlangıç para birimi TRY'dir.

### users

Tek yönetici hesabı için kimlik ve parola özeti tutar. Gelecekte eklenecek
roller için genişletilebilir, ancak rol yetkileri ilk sürüm kapsamı dışındadır.

### customers

Firma adı, yetkili, telefon, adres, vergi bilgileri ve notları tutar. Firma adı
zorunludur. Telefon ve firma adına göre hızlı arama desteklenir.

### jobs

Bir müşteriye bağlı iş/siparişi temsil eder. İş numarası, desen adı/kodu,
opsiyonel desen dosyası, kumaş, baskı türü, renk, miktar, birim, birim fiyat,
toplam tutar, sipariş/teslim tarihleri ve notlar içerir. Toplam tutar API
tarafında miktar ile birim fiyatın çarpımından hesaplanır.

İş durumları: `yeni`, `desen_hazirlaniyor`, `onay_bekliyor`, `baskida`,
`hazir`, `teslim_edildi`, `iptal_edildi`.

### job_status_history

Her durum değişikliğinin önceki ve yeni durumunu, değişiklik zamanını ve
isteğe bağlı notunu saklar. İş durumu değişirken `jobs` ve bu tablo aynı
transaction içinde güncellenir.

### customer_transactions

Müşterinin finansal hareket defteridir. Türleri başlangıçta `job_sale`,
`collection`, `received_check` ve `adjustment` değerlerini kapsar. İlk sürümde
iş oluşturma işlemi `job_sale` hareketini otomatik üretir; sonraki sürümlerde
tahsilat ve çek modülleri mevcut yapıyı kullanır.

Her hareket müşteri, isteğe bağlı iş, tür, tutar, para birimi, işlem tarihi,
açıklama ve iptal/ters kayıt bağlantısını taşır. Silme yerine, gelecekte
ters kayıt/iptal ile düzeltme yapılır. Müşterinin açık bakiyesi defter
hareketlerinden hesaplanır.

## Temel kullanıcı akışları

1. Yönetici müşteri ekler veya arama ile mevcut müşteriyi bulur.
2. Müşteri sayfası açık bakiye, aktif işler, son hareketler ve ilgili işlere
   geçişleri gösterir.
3. Yönetici kısa formdan yeni iş açar. API toplamı hesaplar, işi ve satış
   hareketini tek transaction içinde kaydeder.
4. Yönetici iş kartında durumu doğrudan değiştirir. Değişiklik geçmişe yazılır.
5. Ana Sayfa aktif, bugün teslim, geciken ve hazır işleri; müşteri
   alacaklarının toplamını gerçek verilerden gösterir.

## API sınırları

İlk sürümde `/api/v1` altında aşağıdaki kaynaklar sağlanır:

- `GET, POST /customers`
- `GET, PATCH /customers/:id`
- `GET /customers/:id/transactions`
- `GET, POST /jobs`
- `GET, PATCH /jobs/:id`
- `POST /jobs/:id/status`
- `GET /dashboard`
- Sağlık denetimi için `GET /healthz`

POST/PATCH istekleri hem HTTP sınırında hem de servis katmanında doğrulanır.
Hatalar Türkçe mesaj ve uygun HTTP durum kodu ile dönülür.

## Güvenilirlik kuralları

- İş oluşturma: iş kaydı, başlangıç durum geçmişi ve satış hareketi tek
  PostgreSQL transaction içinde oluşturulur.
- İş durumu değiştirme: geçerli durum değeri doğrulanır; iş ve tarihçe aynı
  transaction içinde yazılır.
- Finansal kayıtlarda para tutarı pozitif ve iki ondalık hassasiyette olmalıdır.
- Bir müşteri silinmek yerine ileride pasifleştirilebilir; ilişkili finansal
  kaydı olan müşteri fiziksel olarak silinmez.
- Dashboard sorguları yalnızca tamamlanmış veritabanı işlemlerini görür.

## Arayüz ilkeleri

Arayüz Türkçe, mobil/tablet/masaüstü uyumlu ve yalın tutulur. İlk menüde Ana
Sayfa, İşler ve Müşteriler görünür; diğer modüller gelecekte eklenir. Bir iş
oluşturma formunda sık kullanılan alanlar önde, not ve opsiyonel dosya gibi
alanlar “Diğer Bilgiler” altında yer alır. Kritik silme veya finansal düzeltme
işlemleri onay ister; olağan kayıt ve durum değişikliği ek onay istemez.

## Test ve doğrulama

- Go birim testleri: tutar hesaplama, durum doğrulama, müşteri bakiye hesaplama
  ve transaction gerektiren servis senaryoları.
- API entegrasyon testleri: müşteri ve iş oluşturma, durum değiştirme,
  dashboard toplulaştırmaları.
- Frontend testleri: müşteri/iş formlarının zorunlu alanları, API hata görünümü
  ve temel listeleme akışları.
- Çalışma zamanı doğrulaması: temiz ortamda migration uygulanması ve Docker
  Compose ile uygulamanın açılması.

## İlk sürüm dışı bırakılanlar

Çek, tahsilat/ödeme, personel, gider/gelir, banka hesapları, gelişmiş raporlar,
dosya depolama altyapısı ve çoklu kullanıcı rol yönetimi bu planın dışındadır.
Veri modeli ve API modül sınırları bu özelliklerin sonraki sürümlerde eklenmesi
için hazırlanır.
