import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

// OpenRouter API anahtarı (.env dosyasından okunur)
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

export default function App() {
  const [inputText, setInputText] = useState(
    "Tedarikçi ABC Ltd. Yazılım danışmanlık hizmeti için 120.000 TL fatura kesti. Ödeme vadesi 10 gün talep ediliyor. Departman aylık bütçesi 100.000 TL."
  );
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState("");

  const [extractedData, setExtractedData] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [executiveDecision, setExecutiveDecision] = useState(null);

  // Ortak API Çağrı Fonksiyonu
  const callLLM = async (systemPrompt, userPrompt) => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://localhost:8081",
        "X-Title": "Enterprise Agent App",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat", // Hızlı ve tam JSON çıkaran kararlı model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const handleRunAgents = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setExtractedData(null);
    setComplianceData(null);
    setExecutiveDecision(null);

    try {
      // --- AJAN 1: Extractor (Veri Ayrıştırıcı) ---
      setCurrentStep("Ajan 1 çalışıyor: Ham metinden veri ayrıştırılıyor...");
      const agent1System = `Sen bir Kurumsal Veri Ayrıştırıcı Ajansın. Gelen serbest metinden fatura/teklif verilerini çıkarıp SADECE geçerli bir JSON döndür. Başka hiçbir açıklama yazma.
Format:
{
  "vendor": "Tedarikçi adı",
  "amount": "Tutar",
  "service": "Hizmet konusu",
  "term_days": "Vade (gün)",
  "budget": "Belirtilen bütçe"
}`;
      const agent1Res = await callLLM(agent1System, inputText);
      const cleanJson1 = agent1Res.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson1);
      setExtractedData(parsedData);

      // --- AJAN 2: Compliance / Risk Denetçisi ---
      setCurrentStep("Ajan 2 çalışıyor: Şirket kuralları ve riskler denetleniyor...");
      const agent2System = `Sen bir Kurumsal Uyum ve Finans Risk Denetçisisin. Gelen JSON verilerini şirket politikalarına göre denetle:
Kurallar:
1. Tutar bütçeyi aşıyorsa: Yüksek Finansal Risk.
2. Vade 30 günden kısaysa: Nakit Akışı Riski (Standart şirket vadesi 30 gündür).
SADECE geçerli bir JSON döndür:
{
  "status": "UYGUN" veya "RISKLI",
  "detected_risks": ["Risk maddesi 1", "Risk maddesi 2"],
  "budget_variance": "Bütçe aşım/kalan durumu özeti"
}`;
      const agent2Res = await callLLM(agent2System, JSON.stringify(parsedData));
      const cleanJson2 = agent2Res.replace(/```json/g, '').replace(/```/g, '').trim();
      const complianceParsed = JSON.parse(cleanJson2);
      setComplianceData(complianceParsed);

      // --- AJAN 3: Executive Advisor (Yönetici Karar Ajanı) ---
      setCurrentStep("Ajan 3 çalışıyor: Yönetici karar özeti üretiliyor...");
      const agent3System = `Sen bir CFO ve Genel Müdür Danışmanı Ajansın. Ayrıştırılan veri ve risk raporunu okuyarak yönetici için net bir karar üret.
SADECE geçerli bir JSON döndür:
{
  "recommendation": "ONAYLA" veya "REDDET" veya "PAZARLIK ET",
  "executive_summary": "1-2 cümlelik net karar gerekçesi",
  "action_items": ["Yöneticinin atması gereken adım 1", "Adım 2"]
}`;
      const agent3Input = JSON.stringify({ extracted: parsedData, compliance: complianceParsed });
      const agent3Res = await callLLM(agent3System, agent3Input);
      const cleanJson3 = agent3Res.replace(/```json/g, '').replace(/```/g, '').trim();
      const execParsed = JSON.parse(cleanJson3);
      setExecutiveDecision(execParsed);

      setCurrentStep("");
    } catch (error) {
      console.error(error);
      alert("Hata oluştu. API anahtarını ve internet bağlantını kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.headerTitle}>Enterprise Agent Workflow</Text>
          <Text style={styles.subtitle}>Çoklu Ajan Tabanlı Tedarik & Risk Karar Masası</Text>

          <View style={styles.inputCard}>
            <Text style={styles.label}>Girdi Verisi (Teklif / Fatura / E-posta):</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Metni buraya yapıştırın..."
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRunAgents}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Ajan Pipeline'ını Başlat</Text>
              )}
            </TouchableOpacity>
            {loading && <Text style={styles.stepText}>{currentStep}</Text>}
          </View>

          {/* AJAN 1 SONUÇ KARTI */}
          {extractedData && (
            <View style={styles.card}>
              <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.badgeText}>Ajan 1: Extractor</Text>
              </View>
              <Text style={styles.cardItem}><Text style={styles.bold}>Tedarikçi:</Text> {extractedData.vendor}</Text>
              <Text style={styles.cardItem}><Text style={styles.bold}>Hizmet:</Text> {extractedData.service}</Text>
              <Text style={styles.cardItem}><Text style={styles.bold}>Tutar:</Text> {extractedData.amount}</Text>
              <Text style={styles.cardItem}><Text style={styles.bold}>Vade:</Text> {extractedData.term_days}</Text>
              <Text style={styles.cardItem}><Text style={styles.bold}>Bütçe:</Text> {extractedData.budget}</Text>
            </View>
          )}

          {/* AJAN 2 SONUÇ KARTI */}
          {complianceData && (
            <View style={styles.card}>
              <View style={[styles.badge, { backgroundColor: complianceData.status === 'RISKLI' ? '#ef4444' : '#10b981' }]}>
                <Text style={styles.badgeText}>Ajan 2: Compliance ({complianceData.status})</Text>
              </View>
              <Text style={styles.cardItem}><Text style={styles.bold}>Bütçe Durumu:</Text> {complianceData.budget_variance}</Text>
              <Text style={[styles.bold, { marginTop: 8 }]}>Tespit Edilen Riskler:</Text>
              {complianceData.detected_risks?.map((risk, index) => (
                <Text key={index} style={styles.bulletItem}>• {risk}</Text>
              ))}
            </View>
          )}

          {/* AJAN 3 SONUÇ KARTI */}
          {executiveDecision && (
            <View style={[styles.card, { borderColor: '#8b5cf6', borderWidth: 1.5 }]}>
              <View style={[styles.badge, { backgroundColor: '#8b5cf6' }]}>
                <Text style={styles.badgeText}>Ajan 3: Executive Decision</Text>
              </View>
              <Text style={[styles.decisionText, { color: executiveDecision.recommendation === 'REDDET' ? '#dc2626' : '#2563eb' }]}>
                Öneri: {executiveDecision.recommendation}
              </Text>
              <Text style={styles.summaryText}>{executiveDecision.executive_summary}</Text>
              <Text style={[styles.bold, { marginTop: 8 }]}>Aksiyon Maddeleri:</Text>
              {executiveDecision.action_items?.map((item, index) => (
                <Text key={index} style={styles.bulletItem}>→ {item}</Text>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 16, marginTop: 4 },
  inputCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 },
  textInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 90, textAlignVertical: 'top', backgroundColor: '#f1f5f9' },
  button: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonDisabled: { backgroundColor: '#94a3b8' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  stepText: { marginTop: 10, fontSize: 12, color: '#2563eb', fontStyle: 'italic', textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardItem: { fontSize: 13, color: '#334155', marginBottom: 4 },
  bold: { fontWeight: '700', color: '#0f172a' },
  bulletItem: { fontSize: 13, color: '#475569', marginLeft: 6, marginTop: 2 },
  decisionText: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  summaryText: { fontSize: 14, color: '#334155', lineHeight: 20, marginTop: 4 }
});
