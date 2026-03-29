import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STAGE_MESSAGES = [
  "Yapay zeka çocuğunuzun yaşına ve cinsiyetine uygun 20 soru üretiyor…",
  "Model yoğunluğuna bağlı olarak işlem bir dakikaya kadar sürebilir; bu beklenen bir durum.",
  "Lütfen sayfayı kapatmayın veya yenilemeyin — hazır olunca otomatik olarak devam edeceksiniz.",
  "Son düzenlemeler tamamlanıyor…",
];

/**
 * LLM soru üretimi 30–60 sn sürebilir; kopya ve aşamalı mesajlar bekleme algısını yumuşatır.
 */
const LoadingPersonalizedQuestions = () => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setStage(1), 12_000);
    const t2 = window.setTimeout(() => setStage(2), 28_000);
    const t3 = window.setTimeout(() => setStage(3), 48_000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 loading-pq-wrap"
      style={{ background: "var(--gradient-hero)" }}
    >
      <Loader2 className="w-10 h-10 animate-spin text-primary shrink-0" aria-hidden />
      <div className="max-w-md text-center space-y-3">
        <p className="font-display font-bold text-foreground text-lg">Sorular kişiselleştiriliyor…</p>
        <p className="text-sm text-muted-foreground font-body leading-relaxed">
          Genelde <strong className="text-foreground font-semibold">30–60 saniye</strong> sürer. Yoğun saatlerde biraz daha uzayabilir;
          arka planda güvenli şekilde çalışıyoruz — lütfen bu ekranda kalın.
        </p>
        <div
          className="h-1.5 w-full max-w-xs mx-auto rounded-full bg-muted overflow-hidden pq-shimmer-track"
          aria-hidden
        >
          <div className="pq-shimmer-bar" />
        </div>
        <p
          className="text-xs text-muted-foreground font-body leading-relaxed min-h-[2.75rem] transition-opacity duration-300"
          role="status"
          aria-live="polite"
        >
          {STAGE_MESSAGES[stage]}
        </p>
      </div>
      <style>{`
        .loading-pq-wrap .pq-shimmer-track { position: relative; }
        .loading-pq-wrap .pq-shimmer-bar {
          height: 100%;
          width: 40%;
          border-radius: 9999px;
          background: hsl(var(--primary));
          animation: pq-shimmer-move 1.25s ease-in-out infinite;
        }
        @keyframes pq-shimmer-move {
          0% { transform: translateX(-100%); opacity: 0.5; }
          45% { opacity: 1; }
          100% { transform: translateX(320%); opacity: 0.5; }
        }
        @media (prefers-reduced-motion: reduce) {
          .loading-pq-wrap .pq-shimmer-bar { animation: none; opacity: 0.7; transform: none; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default LoadingPersonalizedQuestions;
