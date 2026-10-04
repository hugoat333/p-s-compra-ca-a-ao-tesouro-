"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderView } from "@/lib/orderView";
import type { ThemeId } from "@/lib/themes";
import { validateChildName } from "@/lib/childName";
import { api } from "@/lib/client/api";
import EmailGate from "./components/EmailGate";
import ThemePicker from "./components/ThemePicker";
import NameField from "./components/NameField";
import AdventureSummary from "./components/AdventureSummary";
import PreparingProgress from "./components/PreparingProgress";
import ReadyScreen from "./components/ReadyScreen";
import { Validating, NotFound, GenerationFailed } from "./components/StatusScreens";
import s from "./personalizar.module.css";

type Phase =
  | { name: "boot" }
  | { name: "email"; error?: string }
  | { name: "validating" }
  | { name: "notFound" }
  | { name: "form" }
  | { name: "preparing" }
  | { name: "ready"; order: OrderView; fresh: boolean }
  | { name: "genFailed"; order?: OrderView };

// localStorage é só conveniência de UI (lembrar o link). Nunca prova pagamento: o servidor valida o token sempre.
const STORAGE_KEY = "tesouro.access";

function remember(token: string) {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("t", token);
  window.history.replaceState(null, "", url.toString());
}

function forget() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.delete("t");
  window.history.replaceState(null, "", url.toString());
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// O webhook pode chegar alguns segundos depois do redirecionamento: tentamos de novo antes de desistir.
const LOOKUP_RETRY_DELAYS = [2500, 3500, 5000];

export default function PersonalizarClient({ thumbs }: { thumbs: Record<ThemeId, boolean> }) {
  const [phase, setPhase] = useState<Phase>({ name: "boot" });
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeId | null>(null);
  const [childName, setChildName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const submitting = useRef(false);

  const applyOrder = useCallback((order: OrderView, fresh: boolean) => {
    if (order.personalization === "completed") {
      setTheme(order.theme);
      setChildName(order.childName ?? "");
      setPhase(order.ready ? { name: "ready", order, fresh } : { name: "genFailed", order });
    } else {
      setPhase({ name: "form" });
    }
  }, []);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("t");
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {}
    const candidate = fromUrl ?? stored;
    if (!candidate) {
      setPhase({ name: "email" });
      return;
    }
    setPhase({ name: "validating" });
    api.status(candidate).then((res) => {
      if (res.ok) {
        setToken(candidate);
        remember(candidate);
        applyOrder(res.data.order, false);
      } else if (res.status === 404) {
        forget();
        setPhase(fromUrl ? { name: "notFound" } : { name: "email" });
      } else {
        setPhase({ name: "email", error: "Não foi possível validar agora. Tente novamente." });
      }
    });
  }, [applyOrder]);

  const lookup = useCallback(
    async (email: string) => {
      setPhase({ name: "validating" });
      for (let attempt = 0; ; attempt++) {
        const res = await api.lookup(email);
        if (res.ok) {
          setToken(res.data.token);
          remember(res.data.token);
          applyOrder(res.data.order, false);
          return;
        }
        if (res.code === "invalid_email") return setPhase({ name: "email", error: "Confira o e-mail digitado." });
        if (res.code === "rate_limited") {
          return setPhase({ name: "email", error: "Muitas tentativas. Aguarde um minuto e tente novamente." });
        }
        if (res.code === "not_found" && attempt < LOOKUP_RETRY_DELAYS.length) {
          await sleep(LOOKUP_RETRY_DELAYS[attempt]);
          continue;
        }
        if (res.code === "not_found") return setPhase({ name: "notFound" });
        return setPhase({ name: "email", error: "Não foi possível validar agora. Tente novamente." });
      }
    },
    [applyOrder],
  );

  const nameCheck = validateChildName(childName);
  const canSubmit = phase.name === "form" && !!token && !!theme && nameCheck.ok;

  const submit = useCallback(async () => {
    if (submitting.current || !token || !theme) return;
    const check = validateChildName(childName);
    if (!check.ok) {
      setNameTouched(true);
      return;
    }
    submitting.current = true;
    setServerError(null);
    setChildName(check.value);
    setPhase({ name: "preparing" });
    const res = await api.personalize(token, check.value, theme);
    submitting.current = false;
    if (res.ok) return applyOrder(res.data.order, true);
    if (res.code === "invalid") {
      setServerError(res.message ?? "Confira os dados informados.");
      return setPhase({ name: "form" });
    }
    if (res.code === "not_found") {
      forget();
      return setPhase({ name: "notFound" });
    }
    setPhase({ name: "genFailed" });
  }, [token, theme, childName, applyOrder]);

  const retryGeneration = useCallback(async () => {
    if (submitting.current || !token) return;
    const current = phase.name === "genFailed" ? phase.order : undefined;
    const retryTheme = current?.theme ?? theme;
    const retryName = current?.childName ?? childName;
    if (!retryTheme) return setPhase({ name: "form" });
    submitting.current = true;
    setPhase({ name: "preparing" });
    const res = await api.personalize(token, retryName, retryTheme);
    submitting.current = false;
    if (res.ok) return applyOrder(res.data.order, true);
    if (res.code === "not_found") return setPhase({ name: "notFound" });
    setPhase({ name: "genFailed", order: current });
  }, [token, phase, theme, childName, applyOrder]);

  return (
    <main className={s.page}>
      <header className={s.brand} aria-label="O Tesouro do Dia das Crianças">
        <span className={s.brandMark} aria-hidden="true">
          🗺️
        </span>
        <span className={s.brandName}>O Tesouro do Dia das Crianças</span>
      </header>

      <div className={s.container}>
        {phase.name === "boot" && <Validating />}
        {phase.name === "validating" && <Validating />}
        {phase.name === "email" && <EmailGate onSubmit={lookup} error={phase.error} />}
        {phase.name === "notFound" && (
          <NotFound
            onRetry={() => {
              forget();
              setPhase({ name: "email" });
            }}
          />
        )}

        {phase.name === "form" && (
          <>
            <section className={`${s.card} ${s.congrats}`} aria-live="polite">
              <h1 className={s.title}>🎉 Parabéns pela sua compra!</h1>
              <p className={s.subtitle}>Agora falta só um passo para preparar uma aventura inesquecível.</p>
              <ul className={s.checks}>
                <li>
                  <span aria-hidden="true">✓</span> Pagamento confirmado
                </li>
                <li>
                  <span aria-hidden="true">✓</span> Compra realizada com sucesso
                </li>
              </ul>
              <p className={s.lead}>
                Escolha o tema da missão e informe o nome da criança. Nós vamos preparar o restante para você.
              </p>
            </section>

            <form
              className={s.form}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <ThemePicker value={theme} onChange={setTheme} thumbs={thumbs} />
              <NameField
                value={childName}
                onChange={(v) => {
                  setChildName(v);
                  setServerError(null);
                }}
                onBlur={() => setNameTouched(true)}
                error={serverError ?? (nameTouched && !nameCheck.ok ? nameCheck.error : null)}
              />
              <AdventureSummary theme={theme} childName={nameCheck.ok ? nameCheck.value : ""} />
              <button type="submit" className={s.cta} disabled={!canSubmit}>
                PREPARAR MINHA AVENTURA
              </button>
              {!canSubmit && (
                <p className={s.hint}>
                  {!theme ? "Escolha um tema para continuar." : "Digite o nome da criança para continuar."}
                </p>
              )}
            </form>
          </>
        )}

        {phase.name === "preparing" && <PreparingProgress childName={nameCheck.ok ? nameCheck.value : childName} />}

        {phase.name === "ready" && token && <ReadyScreen order={phase.order} token={token} fresh={phase.fresh} />}

        {phase.name === "genFailed" && <GenerationFailed onRetry={retryGeneration} />}
      </div>
    </main>
  );
}
