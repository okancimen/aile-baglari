

# Çocuk Testi Bitişinde Gap Gizleme ve Ebeveyne E-posta ile Sonuç Gönderme

## Özet
Çocuk testi bittiğinde çocuğa kutlama ekranı gösterilecek, sonuçlar gösterilmeyecek. Ebeveyne sonuç linki e-posta ile gönderilecek.

## Değişiklikler

### 1. DB: `quiz_sessions` tablosuna `child_name` ve `child_gender` kolonları ekle
- Sonuç e-postasında ve devam linkinde çocuk bilgisi gerekli

### 2. `useQuiz.ts` — Yeni `"child-done"` phase
- Phase tipi: `"child-done"` eklenir
- Çocuk testi bittiğinde `"results"` yerine `"child-done"` phase'ine geçilir
- Akış 2 (çocuk yanımda): Skorları hesapla, DB'ye session kaydet (parent_scores + child_scores + child_name + child_gender), `"child-done"`'a geç
- Yeni `showResults` fonksiyonu — e-posta gönderildikten sonra "results" phase'ine geçmek için (kullanılmayacak ama ileride lazım olabilir)

### 3. Yeni bileşen: `src/components/ChildComplete.tsx`
- Çocuğun adı ve cinsiyetine göre kişiselleştirilmiş kutlama ekranı (konfeti animasyonu, karakter emojisi)
- Gap/skor/karşılaştırma bilgisi **yok**
- Alt kısımda ebeveyne yönelik küçük e-posta formu: "Sonuçlarınızı e-posta ile alın"
- E-posta girildiğinde:
  - Session DB'ye kaydedilir (veya güncellenir)
  - `send-action-plan` edge function ile sonuç linki gönderilir
  - Başarı mesajı gösterilir

### 4. `ContinueQuiz.tsx` — Akış 1 güncellemesi
- Çocuk testi bittiğinde `"results"` yerine `"child-done"` phase'ine geç
- Kayıtlı e-posta varsa arka planda otomatik sonuç e-postası gönder
- `ChildComplete` bileşenini render et (e-posta formu gizli, çünkü zaten gönderildi)

### 5. `Index.tsx` — `"child-done"` phase render
- `ChildComplete` bileşenini render et, gerekli prop'ları geç

## Akış Diyagramı

```text
=== Akış 1: E-posta ile devam (ContinueQuiz) ===
Ebeveyn link gönderdi → Çocuk linke tıkladı → Çocuk testi bitti
  → ChildComplete (kutlama) + otomatik e-posta gönderimi
  → Ebeveyn e-postadaki yeni linke tıklar → QuizComparison

=== Akış 2: Çocuk yanımda (Index) ===
Ebeveyn testi bitti → "Çocuğum yanımda" → Çocuk testi bitti
  → ChildComplete (kutlama + e-posta formu)
  → Ebeveyn e-posta girer → Session kaydedilir + sonuç linki gönderilir
  → Ebeveyn e-postadaki linke tıklar → QuizComparison
```

