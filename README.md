# Enterprise Agent Workflow

Çoklu Ajan (Multi-Agent) mimarisiyle çalışan, kurumsal tedarik tekliflerini, faturaları ve e-postaları analiz ederek finansal uyum denetimi ve yönetici karar özeti üreten mobil uygulama (React Native & Expo).

## Mimari ve Ajan Akışı (Agent Pipeline)

Uygulama, serbest metin olarak girilen tedarik/fatura verisini sırasıyla 3 uzman yapay zeka ajanından geçirir:

1. **Ajan 1 — Extractor (Veri Ayrıştırıcı):**
   Ham metin içerisinden tedarikçi adı (`vendor`), hizmet konusu (`service`), tutar (`amount`), ödeme vadesi (`term_days`) ve departman bütçesi (`budget`) bilgilerini yapılandırılmış JSON formatında ayrıştırır.
2. **Ajan 2 — Compliance (Uyum ve Risk Denetçisi):**
   Ayrıştırılan verileri şirket politikalarına göre (bütçe aşımı ve 30 gün standart vade kuralı) denetler; uygunluk durumunu (`UYGUN` / `RISKLI`), bütçe sapmasını ve tespit edilen risk maddelerini raporlar.
3. **Ajan 3 — Executive Decision (Yönetici Karar Danışmanı):**
   Çıkarılan verileri ve uyum raporunu birleştirerek CFO / Genel Müdür seviyesinde net bir aksiyon önerisi (`ONAYLA`, `REDDET` veya `PAZARLIK ET`), yönetici özeti ve aksiyon adımları üretir.

## Teknolojiler

- **Framework:** [Expo](https://expo.dev) (SDK 58) & [React Native](https://reactnative.dev)
- **LLM Entegrasyonu:** [OpenRouter API](https://openrouter.ai) (`deepseek/deepseek-chat`)

## Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleyin

```bash
git clone https://github.com/aykutkarakurtt/enterprise-agent-app.git
cd enterprise-agent-app
npm install
```

### 2. Ortam Değişkenlerini (`.env`) Ayarlayın

Proje kök dizininde bir `.env` dosyası oluşturun ve OpenRouter API anahtarınızı ekleyin:

```env
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Uygulamayı Başlatın

```bash
npx expo start
```

Açılan terminal ekranındaki QR kodu **Expo Go** uygulaması ile taratarak veya iOS/Android emülatör üzerinden uygulamayı çalıştırabilirsiniz.

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
