import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, TrendingUp, TrendingDown, Minus, Lightbulb, BookOpen, Mail, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QuizComparisonProps {
  parentScores: Record<string, number>;
  childScores: Record<string, number>;
  onRestart: () => void;
}

const categoryLabels: Record<string, string> = {
  duzen_ve_rutin: "Düzen ve Rutin",
  sosyallik: "Sosyallik",
  sebat_ve_azim: "Sebat ve Azim",
  duyusal_hassasiyet: "Duyusal Hassasiyet",
  uyum_saglama: "Uyum Sağlama",
  duygusal_tepki: "Duygusal Tepki",
  bagimsizlik: "Bağımsızlık",
  fiziksel_aktivite: "Fiziksel Aktivite",
  merak_ve_kesif: "Merak ve Keşif",
  odaklanma: "Odaklanma",
};

const categoryEmojis: Record<string, string> = {
  duzen_ve_rutin: "📋",
  sosyallik: "🤝",
  sebat_ve_azim: "💪",
  duyusal_hassasiyet: "🎵",
  uyum_saglama: "🔄",
  duygusal_tepki: "💖",
  bagimsizlik: "🦋",
  fiziksel_aktivite: "🏃",
  merak_ve_kesif: "🔍",
  odaklanma: "🎯",
};

interface CategoryData {
  match: string;
  parentHigh: string;
  childHigh: string;
  actions: {
    match: string[];
    parentHigh: string[];
    childHigh: string[];
  };
}

const categoryInsights: Record<string, CategoryData> = {
  duzen_ve_rutin: {
    match: "Düzen ve rutin konusunda uyumlusunuz!",
    parentHigh: "Ebeveyn daha fazla düzen bekliyor, çocuk daha esnek bir yapıya sahip.",
    childHigh: "Çocuğunuz rutinlere doğal olarak yatkın, beklentileriniz gerçekçi.",
    actions: {
      match: [
        "Birlikte haftalık rutin takvimi oluşturun ve duvara asın.",
        "Rutinleri oyunlaştırarak çocuğunuzun motivasyonunu artırın.",
      ],
      parentHigh: [
        "Katı kurallar yerine 'esnek çerçeveler' oluşturun — örneğin ödev saatini 16:00-18:00 arası bırakın, tam saati çocuğunuz seçsin.",
        "Görsel bir rutin panosu hazırlayın; çocuğunuz tamamladığı adımları işaretlesin.",
        "Haftada bir gün 'kuralsız gün' tanıyarak çocuğunuzun özgür karar vermesine izin verin.",
      ],
      childHigh: [
        "Çocuğunuzun düzen sevgisini destekleyin, kendi odasını organize etmesine sorumluluk verin.",
        "Rutinlerde küçük sürprizler ekleyerek esnekliği de öğretin.",
      ],
    },
  },
  sosyallik: {
    match: "Sosyallik konusunda benzer bakış açılarınız var.",
    parentHigh: "Ebeveyn daha sosyal bir çocuk bekliyor; çocuğunuz daha sakin bir yapıda olabilir.",
    childHigh: "Çocuğunuz sosyal ortamları seviyor, bu enerjisini destekleyin!",
    actions: {
      match: [
        "Birlikte sosyal etkinliklere katılarak bağınızı güçlendirin.",
        "Çocuğunuzla rol yapma oyunları oynayarak sosyal becerilerini geliştirin.",
      ],
      parentHigh: [
        "Çocuğunuzu kalabalık gruplara zorlamak yerine 1-2 kişilik küçük buluşmalar planlayın.",
        "Sosyal ortamlarda 'güvenli liman' olun — yanında durun, hazır olduğunda geri çekilin.",
        "İçe dönüklüğün bir zayıflık olmadığını kabul edin; derin düşünme ve gözlem yeteneği olarak değerlendirin.",
        "Sosyal becerileri evde güvenli ortamda pratik edin: selamlaşma, göz teması, teşekkür etme oyunları.",
      ],
      childHigh: [
        "Çocuğunuzun sosyal enerjisini takım sporları veya drama kulübüne yönlendirin.",
        "Arkadaş edinme becerisini takdir edin ve eve arkadaş davet etmesini teşvik edin.",
        "Sosyal becerilerini liderlik fırsatlarıyla destekleyin.",
      ],
    },
  },
  sebat_ve_azim: {
    match: "Sebat ve azim konusunda uyum içindesiniz.",
    parentHigh: "Ebeveyn daha fazla kararlılık bekliyor; çocuğunuzun motivasyonunu artırın.",
    childHigh: "Çocuğunuz azimli bir yapıya sahip, onu desteklemeye devam edin!",
    actions: {
      match: [
        "Birlikte uzun vadeli bir proje başlatın (puzzle, maket, bahçe vb.).",
        "Tamamlanan hedefleri kutlayarak motivasyonu artırın.",
      ],
      parentHigh: [
        "Büyük görevleri küçük, başarılabilir adımlara bölün. Her adımı kutlayın.",
        "'Henüz yapamıyorum' dilini öğretin — 'Yapamıyorum' yerine 'Henüz öğrenmedim' deyin.",
        "Süreç odaklı övgü kullanın: 'Ne kadar çok çalıştın!' (sonuç değil, çaba övün).",
        "Zorluk seviyesini kademeli artırın; çocuğunuzun 'akış' durumunu yakalamasına yardımcı olun.",
      ],
      childHigh: [
        "Azimli yapısını takdir edin ama mükemmeliyetçiliğe dönüşmemesine dikkat edin.",
        "Bazen 'bırakmak' veya 'ara vermek' in de sağlıklı olduğunu öğretin.",
        "Zorlu ama ulaşılabilir hedefler koyarak gelişimini destekleyin.",
      ],
    },
  },
  duyusal_hassasiyet: {
    match: "Duyusal hassasiyet konusunda anlayış birliği var.",
    parentHigh: "Ebeveyn daha az hassasiyet bekliyor; çocuğunuzun duyusal ihtiyaçlarına dikkat edin.",
    childHigh: "Çocuğunuz duyusal uyaranlara karşı hassas, ortamı ona göre düzenleyin.",
    actions: {
      match: [
        "Ev ortamında duyusal dengeyi birlikte ayarlayın (ışık, ses, koku).",
        "Çocuğunuzun rahat hissettiği ortam koşullarını birlikte keşfedin.",
      ],
      parentHigh: [
        "Duyusal hassasiyeti 'nazlanma' olarak görmeyin — bu nörolojik bir farklılıktır.",
        "Kıyafet etiketlerini kesin, yumuşak kumaşlar tercih edin, çocuğunuzun seçimine saygı gösterin.",
        "Gürültülü ortamlara gitmeden önce çocuğunuzu hazırlayın ve 'kaçış planı' oluşturun.",
        "Yemek konusunda zorlamayın; yeni tatları küçük porsiyonlarla ve baskısız tanıtın.",
      ],
      childHigh: [
        "Hassasiyetini bir güç olarak çerçeveleyin — detayları fark etme yeteneği.",
        "Evde sakin bir köşe oluşturun, aşırı uyarılma durumunda oraya çekilebilsin.",
        "Duyusal oyunlar (kum, hamur, su) ile yavaş yavaş toleransını artırın.",
      ],
    },
  },
  uyum_saglama: {
    match: "Uyum sağlama konusunda paralel düşünüyorsunuz.",
    parentHigh: "Ebeveyn hızlı adaptasyon bekliyor; çocuğunuza geçiş süreleri tanıyın.",
    childHigh: "Çocuğunuz değişimlere kolay uyum sağlıyor, harika!",
    actions: {
      match: [
        "Değişiklikleri birlikte planlayarak her ikinizin de hazır hissetmesini sağlayın.",
        "Yeni deneyimleri maceraya dönüştürün.",
      ],
      parentHigh: [
        "Değişikliklerden önce çocuğunuza 'ön bilgi' verin: 'Yarın planımız değişecek, sana anlatayım.'",
        "Geçiş nesneleri kullanın — yeni ortama giderken tanıdık bir oyuncak veya battaniye götürsün.",
        "'Sosyal hikayeler' tekniğini kullanın: değişikliği önceden hikayeleştirerek anlatın.",
        "Uyum sürecine zaman tanıyın, 'birkaç gün' beklentisini 'birkaç hafta'ya uzatın.",
      ],
      childHigh: [
        "Uyum yeteneğini takdir edin ve yeni deneyimler sunmaya devam edin.",
        "Değişimlere kolay uyum sağlaması, duygularını bastırdığı anlamına gelmediğinden emin olun.",
      ],
    },
  },
  duygusal_tepki: {
    match: "Duygusal tepkiler konusunda uyumlusunuz.",
    parentHigh: "Ebeveyn daha kontrollü tepkiler bekliyor; çocuğunuzun duygularını ifade etmesine alan tanıyın.",
    childHigh: "Çocuğunuz duygularını yoğun yaşıyor, bu normaldir ve desteklenmelidir.",
    actions: {
      match: [
        "Duyguları isimlendirme pratiği yapın: 'Şu an üzgün/kızgın/heyecanlı hissediyorsun.'",
        "Duygu günlüğü tutarak duygusal farkındalığı birlikte geliştirin.",
      ],
      parentHigh: [
        "Çocuğunuzun ağlamasını engellemeye çalışmayın — önce duyguyu kabul edin: 'Çok üzüldüğünü görüyorum.'",
        "Sakinleşme stratejileri birlikte oluşturun: derin nefes, 5-4-3-2-1 tekniği, sarılma.",
        "'Duygu termometresi' kullanın: 1-10 arası hissini puanlamasını isteyin, böylece iletişim kolaylaşır.",
        "Kendi duygusal tepkilerinizi model olarak gösterin: 'Ben de kızdığımda derin nefes alıyorum.'",
      ],
      childHigh: [
        "Yoğun duygularını bastırmak yerine sağlıklı ifade yolları öğretin (resim yapma, fiziksel aktivite).",
        "Duygusal yoğunluğu bir zenginlik olarak görün — empati yeteneği yüksek olabilir.",
        "Sakinleşme köşesi oluşturun, yastık, battaniye ve sevdiği nesnelerle.",
      ],
    },
  },
  bagimsizlik: {
    match: "Bağımsızlık beklentileriniz örtüşüyor.",
    parentHigh: "Ebeveyn daha fazla bağımsızlık bekliyor; adım adım sorumluluk verin.",
    childHigh: "Çocuğunuz bağımsız olmak istiyor, ona güvenli alanlar yaratın.",
    actions: {
      match: [
        "Yaşına uygun sorumluluklar listesi oluşturup birlikte takip edin.",
        "Başarılarını kutlayarak öz güvenini pekiştirin.",
      ],
      parentHigh: [
        "'Seçim hakkı' verin: 'Kırmızı mı mavi mi tişört?' gibi küçük kararlarla başlayın.",
        "Hata yapmasına izin verin — çorabını ters giyse bile müdahale etmeyin, deneyimleyerek öğrensin.",
        "Yardım istediğinde hemen yapmak yerine 'Sen önce dene, takılırsan buradayım' deyin.",
        "Sorumluluk tablosu hazırlayın ve tamamladığı görevler için övgü verin.",
      ],
      childHigh: [
        "Bağımsızlık isteğine güvenli sınırlar çizerek destek olun.",
        "Kendi başına karar vermesine izin verin ama sonuçlarını birlikte değerlendirin.",
        "Güvenli bir şekilde risk almasına alan tanıyın.",
      ],
    },
  },
  fiziksel_aktivite: {
    match: "Fiziksel aktivite konusunda aynı sayfadasınız.",
    parentHigh: "Ebeveyn daha aktif bir çocuk bekliyor; çocuğunuzun tercihlerine de kulak verin.",
    childHigh: "Çocuğunuz çok enerjik, fiziksel aktivite fırsatları sunun!",
    actions: {
      match: [
        "Birlikte düzenli fiziksel aktivite yapın (yürüyüş, bisiklet, yüzme).",
        "Hareket ve sakinlik arasında denge kurun.",
      ],
      parentHigh: [
        "Çocuğunuzun ilgisini çeken aktiviteyi bulun — her çocuk koşmayı sevmek zorunda değil; dans, yüzme, yoga da olabilir.",
        "Ekran süresini kısıtlamak yerine, fiziksel aktiviteyi daha çekici hale getirin.",
        "Hareket molları verin: 20 dk ödev, 10 dk hareket, tekrar ödev.",
        "Sakin aktiviteleri de değerli görün: kitap okuma, resim yapma da gelişim için önemlidir.",
      ],
      childHigh: [
        "Enerji harcayabileceği güvenli alanlar ve zamanlar oluşturun.",
        "Yapılandırılmış spor aktivitelerine (takım sporları, jimnastik) yönlendirin.",
        "Hareketi ödül olarak kullanın: 'Ödevini bitirirsen parka gidebiliriz.'",
        "Enerji yönetimini öğretin: ne zaman hareket, ne zaman sakinlik.",
      ],
    },
  },
  merak_ve_kesif: {
    match: "Merak ve keşif konusunda uyum var.",
    parentHigh: "Ebeveyn daha meraklı bir çocuk bekliyor; çocuğunuzun ilgi alanlarını keşfedin.",
    childHigh: "Çocuğunuz çok meraklı, bu harika bir özellik - destekleyin!",
    actions: {
      match: [
        "Birlikte bilim deneyleri veya doğa keşifleri yapın.",
        "Sorularını ciddiye alın ve birlikte cevap araştırın.",
      ],
      parentHigh: [
        "Merakı doğrudan soru sorarak değil, ortam hazırlayarak tetikleyin: ilginç kitaplar, deneyler, doğa yürüyüşleri.",
        "'Neden?' sorusunu siz sorun: 'Sence bu neden böyle?' diyerek düşünmeye teşvik edin.",
        "Çocuğunuzun mevcut ilgi alanlarını keşfedin ve o alanı derinleştirmesine yardımcı olun.",
      ],
      childHigh: [
        "'Neden?' sorularına sabırla cevap verin veya birlikte araştırın.",
        "Eşyaları kurcalamasına güvenli bir alan sağlayın (eski elektronik aletler, deney setleri).",
        "Merakını proje bazlı aktivitelere dönüştürün: herbaryum, böcek koleksiyonu, basit robotik.",
        "Müze, bilim merkezi ve doğa gezilerine düzenli olarak gidin.",
      ],
    },
  },
  odaklanma: {
    match: "Odaklanma konusunda benzer beklentileriniz var.",
    parentHigh: "Ebeveyn daha uzun odaklanma bekliyor; yaşa uygun beklentiler belirleyin.",
    childHigh: "Çocuğunuz iyi odaklanabiliyor, onu zorlayan aktiviteler sunun.",
    actions: {
      match: [
        "Odaklanma gerektiren aktiviteleri birlikte yapın (bulmaca, lego, kitap okuma).",
        "Dikkat süresini kademeli olarak artırın.",
      ],
      parentHigh: [
        "Yaşa uygun odaklanma sürelerini bilin: 5 yaş = 10-15 dk, 8 yaş = 20-25 dk, 12 yaş = 30-40 dk.",
        "Dikkat dağıtıcıları azaltın: sessiz çalışma alanı, telefon uzakta, masayı toplayın.",
        "Pomodoro tekniğini çocuğa uyarlayın: 15 dk çalış, 5 dk oyun, tekrar.",
        "İlgi alanındaki konularla başlayın — sevdiği konuda odaklanma süresi doğal olarak uzar.",
      ],
      childHigh: [
        "İyi odaklanma becerisini takdir edin ve zorlayıcı projeler sunun.",
        "Uzun süre odaklanma sonrası mola vermesini hatırlatın — aşırı odaklanma da yorucu olabilir.",
        "Farklı alanlarda odaklanmasını teşvik edin (sanat, bilim, müzik).",
      ],
    },
  },
};

const QuizComparison = ({ parentScores, childScores, onRestart }: QuizComparisonProps) => {
  const categories = Object.keys(categoryLabels);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const totalDiff = categories.reduce((sum, cat) => {
    const p = parentScores[cat] || 3;
    const c = childScores[cat] || 3;
    return sum + Math.abs(p - c);
  }, 0);
  const avgDiff = totalDiff / categories.length;
  const compatibilityScore = Math.max(0, Math.round(100 - avgDiff * 20));

  const getCompatLabel = (score: number) => {
    if (score >= 80) return { text: "Mükemmel Uyum! 🌟", color: "hsl(150, 60%, 40%)" };
    if (score >= 60) return { text: "İyi Uyum 👍", color: "hsl(175, 45%, 45%)" };
    if (score >= 40) return { text: "Geliştirilmeli 💡", color: "hsl(45, 90%, 50%)" };
    return { text: "Dikkat Gerektiriyor ⚠️", color: "hsl(25, 95%, 55%)" };
  };

  const compat = getCompatLabel(compatibilityScore);

  // Find top 3 categories with biggest difference for action plan
  const sortedByDiff = [...categories].sort((a, b) => {
    const diffA = Math.abs((parentScores[a] || 3) - (childScores[a] || 3));
    const diffB = Math.abs((parentScores[b] || 3) - (childScores[b] || 3));
    return diffB - diffA;
  });

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
            Ebeveyn-Çocuk Uyum Analizi
          </h1>
          <div className="inline-block rounded-2xl px-6 py-3 mb-2" style={{ background: compat.color }}>
            <span className="font-display font-black text-2xl" style={{ color: "white" }}>
              %{compatibilityScore}
            </span>
          </div>
          <p className="font-display font-bold text-lg" style={{ color: compat.color }}>
            {compat.text}
          </p>
        </motion.div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-6 text-sm font-body">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: "var(--gradient-warm)" }} />
            <span className="text-muted-foreground">Ebeveyn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: "var(--gradient-cool)" }} />
            <span className="text-muted-foreground">Çocuk</span>
          </div>
        </div>

        {/* Category comparisons */}
        <div className="grid gap-4">
          {categories.map((cat, i) => {
            const p = parentScores[cat] || 3;
            const c = childScores[cat] || 3;
            const diff = p - c;
            const absDiff = Math.abs(diff);
            const insight = categoryInsights[cat];
            let insightText = insight?.match || "";
            if (absDiff >= 1) {
              insightText = diff > 0 ? (insight?.parentHigh || "") : (insight?.childHigh || "");
            }

            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card rounded-2xl p-5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{categoryEmojis[cat]}</span>
                  <span className="font-display font-bold text-card-foreground flex-1">
                    {categoryLabels[cat]}
                  </span>
                  {absDiff === 0 ? (
                    <Minus className="w-5 h-5 text-muted-foreground" />
                  ) : diff > 0 ? (
                    <TrendingUp className="w-5 h-5 text-primary" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-secondary" />
                  )}
                </div>

                {/* Parent bar */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground font-body w-16">Ebeveyn</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "var(--gradient-warm)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(p / 5) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                    />
                  </div>
                  <span className="text-xs font-bold font-display w-6 text-right text-card-foreground">{p}</span>
                </div>

                {/* Child bar */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground font-body w-16">Çocuk</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "var(--gradient-cool)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(c / 5) * 100}%` }}
                      transition={{ duration: 0.5, delay: i * 0.06 + 0.1 }}
                    />
                  </div>
                  <span className="text-xs font-bold font-display w-6 text-right text-card-foreground">{c}</span>
                </div>

                {/* Insight */}
                <div
                  className="text-xs font-body px-3 py-2 rounded-lg"
                  style={{
                    background: absDiff >= 2 ? "hsl(25, 95%, 55%, 0.1)" : absDiff === 1 ? "hsl(45, 90%, 50%, 0.1)" : "hsl(150, 60%, 40%, 0.1)",
                    color: absDiff >= 2 ? "hsl(25, 70%, 40%)" : absDiff === 1 ? "hsl(45, 70%, 35%)" : "hsl(150, 50%, 30%)",
                  }}
                >
                  {insightText}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ACTION PLAN SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--gradient-warm)" }}>
              <Lightbulb className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-black text-foreground">
              Ebeveyn Aksiyon Planı
            </h2>
          </div>
          <p className="text-sm text-muted-foreground font-body mb-6">
            Sonuçlarınıza göre en çok dikkat gerektiren alanlar ve size özel öneriler:
          </p>

          <div className="grid gap-5">
            {sortedByDiff.slice(0, 3).map((cat, i) => {
              const p = parentScores[cat] || 3;
              const c = childScores[cat] || 3;
              const diff = p - c;
              const absDiff = Math.abs(diff);
              const insight = categoryInsights[cat];
              let actions: string[] = [];
              
              if (absDiff === 0) {
                actions = insight.actions.match;
              } else if (diff > 0) {
                actions = insight.actions.parentHigh;
              } else {
                actions = insight.actions.childHigh;
              }

              // Take only 2 actions per category
              actions = actions.slice(0, 2);

              const urgency = absDiff >= 2 ? "Öncelikli" : absDiff === 1 ? "İyileştirilebilir" : "Uyumlu";
              const urgencyColor = absDiff >= 2 ? "hsl(25, 95%, 55%)" : absDiff === 1 ? "hsl(45, 90%, 50%)" : "hsl(150, 60%, 40%)";

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.08 }}
                  className="bg-card rounded-2xl p-5"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{categoryEmojis[cat]}</span>
                    <span className="font-display font-bold text-card-foreground flex-1">
                      {categoryLabels[cat]}
                    </span>
                    <span
                      className="text-xs font-body font-semibold px-2 py-1 rounded-full"
                      style={{ background: urgencyColor, color: "white" }}
                    >
                      {urgency}
                    </span>
                  </div>

                  <ul className="space-y-2">
                    {actions.map((action, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm font-body text-card-foreground">
                        <span className="text-primary mt-0.5 shrink-0">✦</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>


          {/* Email Action Plan Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-6 text-center"
          >
            <button
              onClick={() => setShowEmailModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-display font-bold text-primary-foreground transition-all hover:scale-105"
              style={{ background: "var(--gradient-cool)", boxShadow: "var(--shadow-card)" }}
            >
              <Mail className="w-5 h-5" />
              Aksiyon Planını E-posta ile Gönder
            </button>
          </motion.div>

          {/* Email Modal */}
          <AnimatePresence>
            {showEmailModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.5)" }}
                onClick={() => !sending && setShowEmailModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-card rounded-2xl p-6 w-full max-w-md"
                  style={{ boxShadow: "var(--shadow-elevated)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg text-card-foreground">
                      Aksiyon Planını Gönder
                    </h3>
                    <button onClick={() => !sending && setShowEmailModal(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground font-body mb-4">
                    Aksiyon planınız girdiğiniz e-posta adresine gönderilecektir.
                  </p>
                  <input
                    type="email"
                    placeholder="E-posta adresiniz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground font-body mb-4 outline-none focus:ring-2 focus:ring-primary"
                    disabled={sending}
                  />
                  <button
                    onClick={async () => {
                      if (!email || !email.includes('@')) {
                        toast.error('Lütfen geçerli bir e-posta adresi girin.');
                        return;
                      }
                      setSending(true);
                      try {
                        const top3 = sortedByDiff.slice(0, 3);
                        let htmlBody = `
                          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h1 style="text-align: center; color: #333;">Ebeveyn-Çocuk Uyum Analizi</h1>
                            <div style="text-align: center; background: ${compat.color}; color: white; padding: 15px; border-radius: 12px; margin: 16px 0;">
                              <span style="font-size: 28px; font-weight: bold;">%${compatibilityScore}</span>
                              <br/>${compat.text}
                            </div>
                            <h2 style="color: #333;">Ebeveyn Aksiyon Planı</h2>`;

                        top3.forEach((cat, i) => {
                          const p = parentScores[cat] || 3;
                          const c = childScores[cat] || 3;
                          const diff = p - c;
                          const absDiff = Math.abs(diff);
                          const insight = categoryInsights[cat];
                          let actions: string[] = [];
                          if (absDiff === 0) actions = insight.actions.match;
                          else if (diff > 0) actions = insight.actions.parentHigh;
                          else actions = insight.actions.childHigh;
                          actions = actions.slice(0, 2);
                          const urgency = absDiff >= 2 ? "Öncelikli" : absDiff === 1 ? "İyileştirilebilir" : "Uyumlu";
                          const urgencyColor = absDiff >= 2 ? "#e86830" : absDiff === 1 ? "#d4a017" : "#3d9970";

                          htmlBody += `
                            <div style="background: #f9f9f9; border-radius: 12px; padding: 16px; margin: 12px 0;">
                              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="font-size: 20px;">${categoryEmojis[cat]}</span>
                                <strong>${categoryLabels[cat]}</strong>
                                <span style="background: ${urgencyColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: auto;">${urgency}</span>
                              </div>
                              <div style="font-size: 13px; color: #666; margin-bottom: 8px;">Ebeveyn: ${p}/5 | Çocuk: ${c}/5</div>
                              <ul style="margin: 0; padding-left: 20px;">
                                ${actions.map(a => `<li style="margin-bottom: 4px; font-size: 14px;">${a}</li>`).join('')}
                              </ul>
                            </div>`;
                        });

                        htmlBody += `
                            <div style="text-align: center; margin-top: 24px; padding: 16px; background: #f0f7ff; border-radius: 12px;">
                              <p style="color: #555; font-size: 14px;">Her çocuk benzersizdir. Küçük adımlarla büyük değişimler yaratabilirsiniz! 💛</p>
                            </div>
                            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 16px;">EduBot - Ebeveyn-Çocuk Uyum Analizi</p>
                          </div>`;

                        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
                        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/send-action-plan`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            to: email,
                            subject: `Ebeveyn Aksiyon Planı - Uyum Puanı %${compatibilityScore}`,
                            htmlBody,
                          }),
                        });

                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Gönderim başarısız');

                        toast.success('Aksiyon planı e-posta adresinize gönderildi!');
                        setShowEmailModal(false);
                        setEmail('');
                      } catch (err: any) {
                        console.error('Email send error:', err);
                        toast.error('E-posta gönderilemedi: ' + (err.message || 'Bilinmeyen hata'));
                      } finally {
                        setSending(false);
                      }
                    }}
                    disabled={sending}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-display font-bold text-primary-foreground transition-all disabled:opacity-60"
                    style={{ background: "var(--gradient-cool)" }}
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                    {sending ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Closing note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-10 bg-card rounded-2xl p-6 text-center"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <BookOpen className="w-8 h-8 mx-auto mb-3 text-primary" />
          <p className="font-display font-bold text-card-foreground mb-2">Unutmayın!</p>
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            Her çocuk benzersizdir. Bu sonuçlar beklentilerinizi ve çocuğunuzun doğal eğilimlerini
            anlamanıza yardımcı olmak içindir. Küçük adımlarla büyük değişimler yaratabilirsiniz.
            Çocuğunuzla birlikte bu yolculuğun keyfini çıkarın! 💛
          </p>
        </motion.div>

        {/* Restart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-center mt-10"
        >
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-display font-bold text-primary-foreground transition-all hover:scale-105"
            style={{ background: "var(--gradient-warm)", boxShadow: "var(--shadow-elevated)" }}
          >
            <RotateCcw className="w-5 h-5" />
            Tekrar Başla
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default QuizComparison;
