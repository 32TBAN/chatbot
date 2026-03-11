import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bot,
  ChevronRight,
  KeyRound,
  LayoutTemplate,
  LoaderCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  SendHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  getAutomationMainFlow,
  updateAutomationMainFlow,
  type AutomationKey,
  type AutomationMainFlowView,
  type KeywordView,
  type MenuOptionView,
  type QuickAutomationView,
} from "@/lib/automation-main-flow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const quickOrder: AutomationKey[] = ["welcome", "menu", "appointments", "products", "support"];
type SectionTab = "quick" | "menu" | "keywords";
type PreviewMessage = {
  id: string;
  menuOptions?: MenuOptionView[];
  role: "bot" | "user";
  text: string;
};

const sectionTabs: Array<{ id: SectionTab; label: string; icon: typeof Wand2 }> = [
  { id: "quick", label: "Automatizaciones rapidas", icon: Wand2 },
  { id: "menu", label: "Menu principal", icon: LayoutTemplate },
  { id: "keywords", label: "Palabras clave", icon: KeyRound },
];

const targetLabels: Record<AutomationKey, string> = {
  welcome: "Mensaje de bienvenida",
  menu: "Menu principal",
  appointments: "Reserva de citas",
  products: "Catalogo de productos",
  support: "Soporte humano",
};

const quickActionDetails: Record<AutomationKey, string> = {
  welcome: "Cuando un cliente escribe por primera vez.",
  menu: "Ofrece opciones como citas, productos o soporte.",
  appointments: "Permite que el cliente agende una cita automaticamente.",
  products: "Permite que el cliente consulte productos disponibles.",
  support: "Escala la conversacion a un agente.",
};

const emptyFlow: AutomationMainFlowView = {
  flowId: null,
  flowName: "Bot principal de WhatsApp",
  isActive: true,
  quickAutomations: quickOrder.map((key) => ({
    key,
    title: targetLabels[key],
    description: quickActionDetails[key],
    enabled: key === "welcome" || key === "menu",
    nodeId: null,
    message: "",
  })),
  menu: {
    message: "Elige una opcion para continuar.",
    options: [
      { id: "menu-1", label: "Reservar cita", targetKey: "appointments", position: 1 },
      { id: "menu-2", label: "Ver productos", targetKey: "products", position: 2 },
      { id: "menu-3", label: "Hablar con soporte", targetKey: "support", position: 3 },
    ],
  },
  keywords: [],
  nodeRegistry: quickOrder.map((key) => ({
    key,
    label: targetLabels[key],
    enabled: key === "welcome" || key === "menu",
    nodeId: null,
  })),
};

function cloneFlow(flow: AutomationMainFlowView): AutomationMainFlowView {
  return {
    ...flow,
    quickAutomations: flow.quickAutomations.map((item) => ({ ...item })),
    menu: {
      ...flow.menu,
      options: flow.menu.options.map((item) => ({ ...item })),
    },
    keywords: flow.keywords.map((item) => ({ ...item })),
    nodeRegistry: flow.nodeRegistry.map((item) => ({ ...item })),
  };
}

function normalizeFlow(flow: AutomationMainFlowView) {
  return JSON.stringify({
    ...flow,
    menu: {
      ...flow.menu,
      options: flow.menu.options.map((item, index) => ({ ...item, position: index + 1 })),
    },
    keywords: flow.keywords.map((item) => ({
      ...item,
      keyword: item.keyword.trim().toLowerCase(),
      label: item.label.trim(),
      response: item.response.trim(),
    })),
  });
}

function normalizePreviewValue(value: string) {
  return value.trim().toLowerCase();
}
export function AutomationsSection() {
  const { getAccessToken } = useAuth();
  const [serverSnapshot, setServerSnapshot] = useState<AutomationMainFlowView | null>(null);
  const [draft, setDraft] = useState<AutomationMainFlowView>(emptyFlow);
  const [activeTab, setActiveTab] = useState<SectionTab>("quick");
  const [editingKey, setEditingKey] = useState<AutomationKey | null>(null);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = getAccessToken();
      if (!token) {
        if (!active) return;
        setLoading(false);
        setStatus({ tone: "error", message: "No hay una sesion activa para cargar las respuestas automaticas." });
        return;
      }

      const result = await getAutomationMainFlow(token);
      if (!active) return;

      if (!result.ok) {
        setLoading(false);
        setStatus({ tone: "error", message: result.message });
        return;
      }

      setServerSnapshot(result.flow);
      setDraft(cloneFlow(result.flow));
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [getAccessToken]);

  const dirty = serverSnapshot ? normalizeFlow(serverSnapshot) !== normalizeFlow(draft) : false;
  const menuTargets = draft.nodeRegistry.filter((item) => item.key !== "welcome" && item.key !== "menu");
  const previewGreeting = draft.quickAutomations.find((item) => item.key === "welcome")?.message.trim() || "Bienvenido a nuestro negocio";
  const previewMenu = draft.menu.options.filter((item) => item.label.trim());
  const editingAutomation = editingKey ? draft.quickAutomations.find((item) => item.key === editingKey) ?? null : null;

  const setQuickAutomation = (key: AutomationKey, update: Partial<QuickAutomationView>) => {
    setDraft((current) => ({
      ...current,
      quickAutomations: current.quickAutomations.map((item) => (item.key === key ? { ...item, ...update } : item)),
      nodeRegistry: current.nodeRegistry.map((item) => (item.key === key ? { ...item, enabled: update.enabled ?? item.enabled } : item)),
    }));
  };

  const saveDraft = async () => {
    const token = getAccessToken();
    if (!token) {
      setStatus({ tone: "error", message: "No hay una sesion activa para guardar cambios." });
      return;
    }

    setSaving(true);
    setStatus(null);
    const result = await updateAutomationMainFlow(token, draft);
    setSaving(false);

    if (!result.ok) {
      setStatus({ tone: "error", message: result.message });
      return;
    }

    setServerSnapshot(result.flow);
    setDraft(cloneFlow(result.flow));
    setStatus({ tone: "success", message: "Las automatizaciones se guardaron correctamente." });
  };

  const discardDraft = () => {
    if (!serverSnapshot) return;
    setDraft(cloneFlow(serverSnapshot));
    setStatus(null);
  };

  if (loading) {
    return (
      <section className="grid gap-6">
        <Card className="shadow-[0_20px_70px_rgba(18,25,36,0.08)]">
          <CardContent className="flex min-h-[280px] items-center justify-center gap-3 text-muted-foreground">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Cargando configuracion del bot...</span>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="relative grid gap-6 pb-32 lg:pb-12">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="rounded-[1.6rem] border border-border/80 bg-card p-2 shadow-[0_18px_60px_rgba(18,25,36,0.06)]">
          <div className="grid gap-2 md:grid-cols-3">
            {sectionTabs.map(({ icon: Icon, id, label }) => (
              <button
                className={cn(
                  "flex min-h-[72px] items-center gap-3 rounded-[1.15rem] px-4 py-4 text-left transition-all",
                  activeTab === id
                    ? "bg-panel-ink text-panel-ivory shadow-[0_14px_38px_rgba(18,25,36,0.18)]"
                    : "bg-transparent text-panel-ink hover:bg-muted/45",
                )}
                key={id}
                onClick={() => setActiveTab(id)}
                type="button"
              >
                <div className={cn("grid h-11 w-11 place-items-center rounded-2xl border", activeTab === id ? "border-panel-ivory/20 bg-panel-ivory/10" : "border-border bg-muted/50")}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn("font-display text-base uppercase tracking-[0.08em]", activeTab === id ? "text-panel-ivory" : "text-panel-ink")}>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <Button disabled={!dirty || saving} onClick={discardDraft} variant="secondary">Descartar</Button>
          <Button disabled={!dirty || saving} onClick={saveDraft}>
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </Button>
        </div>
      </div>

      {status ? (
        <div className={cn("rounded-2xl border px-4 py-3 text-sm shadow-sm", status.tone === "success" ? "border-emerald-300/80 bg-emerald-100/85 text-emerald-950" : "border-rose-300/80 bg-rose-100/85 text-rose-950")}>
          {status.message}
        </div>
      ) : null}

      <div className="grid gap-6">
        {activeTab === "quick" ? (
          <Card className="border-border/80 bg-card shadow-[0_18px_60px_rgba(18,25,36,0.06)]">
            <CardHeader>
              <CardTitle>Automatizaciones rapidas</CardTitle>
              <CardDescription>Activa respuestas automaticas para los mensajes mas comunes. Haz clic en una card para editarla.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {draft.quickAutomations.map((item) => (
                <button className="group rounded-[1.35rem] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,241,0.95),rgba(243,245,240,0.92))] p-5 text-left shadow-[0_14px_45px_rgba(18,25,36,0.06)] transition-all hover:-translate-y-0.5 hover:border-panel-steel/40 hover:shadow-[0_20px_55px_rgba(18,25,36,0.11)]" key={item.key} onClick={() => setEditingKey(item.key)} type="button">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant={item.enabled ? "success" : "default"}>{item.enabled ? "Activo" : "Inactivo"}</Badge>
                      <h3 className="mt-4 font-display text-2xl uppercase tracking-[0.08em] text-panel-ink">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description || quickActionDetails[item.key]}</p>
                    </div>
                    <label className={cn("inline-flex h-7 w-14 items-center overflow-hidden rounded-full border px-1 transition-colors", item.enabled ? "border-panel-steel/40 bg-panel-signal" : "border-border bg-muted")} onClick={(event) => event.stopPropagation()}>
                      <input checked={item.enabled} className="sr-only" onChange={(event) => setQuickAutomation(item.key, { enabled: event.target.checked })} type="checkbox" />
                      <span className={cn("h-5 w-5 rounded-full bg-panel-ivory shadow transition-transform", item.enabled ? "translate-x-6" : "translate-x-0")} />
                    </label>
                  </div>
                  <div className="mt-5 rounded-2xl border border-border/70 bg-background/85 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Resumen del mensaje</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-panel-ink">{item.message?.trim() || "Todavia no hay un mensaje configurado para esta automatizacion."}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-panel-ink">
                    <span className="inline-flex items-center gap-2 text-muted-foreground"><Sparkles className="h-4 w-4" />Editar automatizacion</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "menu" ? (
          <Card className="border-border/80 bg-card shadow-[0_18px_60px_rgba(18,25,36,0.06)]">
            <CardHeader>
              <CardTitle>Menu principal del chatbot</CardTitle>
              <CardDescription>Cuando un cliente escribe "hola", vera estas opciones. Manten el flujo corto y claro.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="rounded-[1.25rem] border border-border bg-[linear-gradient(180deg,rgba(252,249,241,0.9),rgba(245,246,242,0.88))] p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Mensaje principal</p>
                <textarea className="mt-3 min-h-[120px] w-full rounded-2xl border border-input bg-background/75 px-4 py-4 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" onChange={(event) => setDraft((current) => ({ ...current, menu: { ...current.menu, message: event.target.value } }))} value={draft.menu.message} />
              </div>
              <div className="grid gap-3">
                {draft.menu.options.map((option, index) => (
                  <MenuOptionEditor
                    key={option.id}
                    menuTargets={menuTargets}
                    onChange={(nextOption) => setDraft((current) => ({ ...current, menu: { ...current.menu, options: current.menu.options.map((item) => (item.id === option.id ? { ...nextOption, position: item.position } : item)) } }))}
                    onMoveDown={() => setDraft((current) => ({ ...current, menu: { ...current.menu, options: moveItem(current.menu.options, index, index + 1) } }))}
                    onMoveUp={() => setDraft((current) => ({ ...current, menu: { ...current.menu, options: moveItem(current.menu.options, index, index - 1) } }))}
                    onRemove={() => setDraft((current) => ({ ...current, menu: { ...current.menu, options: current.menu.options.filter((item) => item.id !== option.id) } }))}
                    option={option}
                    position={index + 1}
                    disableDown={index === draft.menu.options.length - 1}
                    disableUp={index === 0}
                  />
                ))}
              </div>
              <Button onClick={() => setDraft((current) => ({ ...current, menu: { ...current.menu, options: [...current.menu.options, { id: `menu-${Date.now()}`, label: "", targetKey: menuTargets[0]?.key ?? "support", position: current.menu.options.length + 1 }] } }))} variant="secondary">Agregar opcion</Button>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "keywords" ? (
          <Card className="border-border/80 bg-card shadow-[0_18px_60px_rgba(18,25,36,0.06)]">
            <CardHeader>
              <CardTitle>Palabras clave</CardTitle>
              <CardDescription>Responde preguntas frecuentes con reglas claras y faciles de mantener.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {draft.keywords.map((keyword, index) => (
                <KeywordEditor key={keyword.id} keyword={keyword} onChange={(nextKeyword) => setDraft((current) => ({ ...current, keywords: current.keywords.map((item) => (item.id === keyword.id ? nextKeyword : item)) }))} onRemove={() => setDraft((current) => ({ ...current, keywords: current.keywords.filter((item) => item.id !== keyword.id) }))} position={index + 1} />
              ))}
              <Button onClick={() => setDraft((current) => ({ ...current, keywords: [...current.keywords, { id: `keyword-${Date.now()}`, keyword: "", label: "", response: "" }] }))} variant="secondary">Agregar palabra clave</Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <FloatingChatPreview
        collapsed={isPreviewCollapsed}
        keywords={draft.keywords}
        menuMessage={draft.menu.message}
        onToggle={() => setIsPreviewCollapsed((current) => !current)}
        previewGreeting={previewGreeting}
        previewMenu={previewMenu}
        quickAutomations={draft.quickAutomations}
      />

      <Dialog onOpenChange={(open) => !open && setEditingKey(null)} open={Boolean(editingAutomation)}>
        <DialogOverlay onClick={() => setEditingKey(null)} />
        <DialogContent className="sm:max-w-[720px]">
          {editingAutomation ? (
            <>
              <DialogHeader>
                <div>
                  <Badge variant={editingAutomation.enabled ? "success" : "default"}>{editingAutomation.enabled ? "Activo" : "Inactivo"}</Badge>
                  <DialogTitle className="mt-4">{editingAutomation.title}</DialogTitle>
                  <DialogDescription>{editingAutomation.description || quickActionDetails[editingAutomation.key]}</DialogDescription>
                </div>
                <DialogCloseButton onClick={() => setEditingKey(null)} />
              </DialogHeader>
              <DialogBody>
                <div className="rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(252,249,241,0.95),rgba(243,245,240,0.9))] p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Automatizacion</p>
                  <p className="mt-2 text-sm leading-6 text-panel-ink">Edita el mensaje que enviara el bot cuando se active esta respuesta.</p>
                </div>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Mensaje</span>
                  <textarea className="min-h-[220px] rounded-2xl border border-input bg-muted/35 px-4 py-4 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" onChange={(event) => setQuickAutomation(editingAutomation.key, { message: event.target.value })} placeholder="Escribe la respuesta automatica." value={editingAutomation.message} />
                </label>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-panel-ink">Activar automatizacion</p>
                    <p className="text-sm text-muted-foreground">Puedes apagarla temporalmente sin borrar su contenido.</p>
                  </div>
                  <label className={cn("inline-flex h-7 w-14 items-center overflow-hidden rounded-full border px-1 transition-colors", editingAutomation.enabled ? "border-panel-steel/40 bg-panel-signal" : "border-border bg-muted")}>
                    <input checked={editingAutomation.enabled} className="sr-only" onChange={(event) => setQuickAutomation(editingAutomation.key, { enabled: event.target.checked })} type="checkbox" />
                    <span className={cn("h-5 w-5 rounded-full bg-panel-ivory shadow transition-transform", editingAutomation.enabled ? "translate-x-6" : "translate-x-0")} />
                  </label>
                </div>
              </DialogBody>
              <DialogFooter>
                <Button onClick={() => setEditingKey(null)} variant="secondary">Cerrar</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function FloatingChatPreview({
  collapsed,
  keywords,
  menuMessage,
  onToggle,
  previewGreeting,
  previewMenu,
  quickAutomations,
}: {
  collapsed: boolean;
  keywords: KeywordView[];
  menuMessage: string;
  onToggle: () => void;
  previewGreeting: string;
  previewMenu: MenuOptionView[];
  quickAutomations: QuickAutomationView[];
}) {
  const [draftMessage, setDraftMessage] = useState("");
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const fallbackMessage = "No entendi tu mensaje. Prueba una opcion del menu o escribe una palabra clave.";
  const keywordRules = keywords.filter((item) => item.keyword.trim());
  const automationMap = new Map(quickAutomations.map((item) => [item.key, item]));

  useEffect(() => {
    const node = messagesRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const appendMessages = (nextMessages: Array<Omit<PreviewMessage, "id">>) => {
    setMessages((current) => [
      ...current,
      ...nextMessages.map((item, index) => ({
        id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        ...item,
      })),
    ]);
  };

  const resolveAutomationMessage = (targetKey: AutomationKey) => {
    const automation = automationMap.get(targetKey);
    if (!automation?.enabled) {
      return "Esta automatizacion aun no esta activa.";
    }

    return automation.message.trim() || `Respuesta pendiente para ${automation.title.toLowerCase()}.`;
  };

  const submitPreview = (rawValue: string, displayValue = rawValue.trim()) => {
    const value = rawValue.trim();
    if (!value) return;

    const normalized = normalizePreviewValue(value);
    const numericChoice = Number.parseInt(normalized, 10);
    const selectedByNumber = Number.isNaN(numericChoice) ? null : previewMenu[numericChoice - 1] ?? null;
    const selectedByLabel = previewMenu.find((option) => normalizePreviewValue(option.label) === normalized) ?? null;
    const matchedKeyword = keywordRules.find((item) => normalizePreviewValue(item.keyword) === normalized) ?? null;
    const nextMessages: Array<Omit<PreviewMessage, "id">> = [{ role: "user", text: displayValue }];

    if (normalized === "hola" || normalized === "menu") {
      nextMessages.push(
        { role: "bot", text: previewGreeting },
        { role: "bot", text: menuMessage.trim() || "Elige una opcion para continuar.", menuOptions: previewMenu },
      );
      appendMessages(nextMessages);
      return;
    }

    if (selectedByNumber || selectedByLabel) {
      const option = selectedByNumber ?? selectedByLabel;
      if (option) {
        nextMessages.push({ role: "bot", text: resolveAutomationMessage(option.targetKey) });
        appendMessages(nextMessages);
        return;
      }
    }

    if (matchedKeyword) {
      nextMessages.push({ role: "bot", text: matchedKeyword.response.trim() || "Respuesta pendiente de configurar." });
      appendMessages(nextMessages);
      return;
    }

    nextMessages.push({ role: "bot", text: fallbackMessage });
    appendMessages(nextMessages);
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 w-[min(420px,calc(100vw-1.5rem))] sm:bottom-6 sm:right-6 sm:w-[390px]">
      <div className="pointer-events-auto overflow-hidden rounded-[1.4rem] border border-border/80 bg-card shadow-[0_24px_80px_rgba(18,25,36,0.18)]">
        <button className="flex w-full items-center justify-between gap-3 border-b border-border/80 bg-[linear-gradient(180deg,rgba(249,251,246,0.94),rgba(243,246,242,0.9))] px-4 py-4 text-left" onClick={onToggle} type="button">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-panel-ink text-panel-ivory">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg uppercase tracking-[0.08em] text-panel-ink">Vista previa del chat</p>
              <p className="text-sm text-muted-foreground">Prueba rapida del bot</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            {collapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </div>
        </button>
        {!collapsed ? (
          <div className="grid gap-4 p-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/30 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Escribe hola, un numero o una palabra clave</p>
              <Button onClick={() => setMessages([])} size="sm" type="button" variant="ghost">
                <RotateCcw className="h-4 w-4" />
                Reiniciar
              </Button>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] border border-border bg-[linear-gradient(180deg,rgba(243,247,242,0.9),rgba(253,251,245,0.95))]">
              <div className="flex items-center gap-3 border-b border-border/80 bg-background/80 px-4 py-4">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-panel-ink text-panel-ivory"><Bot className="h-5 w-5" /></div>
                <div>
                  <p className="font-medium text-panel-ink">Bot de atencion</p>
                  <p className="text-sm text-muted-foreground">WhatsApp del negocio</p>
                </div>
              </div>
              <div className="grid max-h-[min(52vh,480px)] gap-3 overflow-y-auto p-4" ref={messagesRef}>
                {messages.length ? messages.map((message) => (
                  <ChatBubble align={message.role === "user" ? "right" : "left"} key={message.id} title={message.role === "user" ? "Cliente" : "Bot"}>
                    {message.text}
                    {message.menuOptions?.length ? (
                      <div className="mt-3 grid gap-2">
                        {message.menuOptions.map((option, index) => (
                          <button
                            className="rounded-xl border border-border/80 bg-background/90 px-3 py-2 text-left text-sm text-panel-ink transition-colors hover:bg-background"
                            key={option.id}
                            onClick={() => submitPreview(String(index + 1), option.label.trim() || `Opcion ${index + 1}`)}
                            type="button"
                          >
                            {index + 1}. {option.label || "Opcion sin titulo"}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </ChatBubble>
                )) : (
                  <div className="grid gap-3 rounded-[1.25rem] border border-dashed border-border/80 bg-background/70 px-4 py-5 text-sm text-muted-foreground">
                    <p className="font-medium text-panel-ink">Prueba el flujo antes de guardar.</p>
                    <p>Escribe <span className="font-medium text-panel-ink">hola</span>, selecciona una opcion del menu o usa una palabra clave como <span className="font-medium text-panel-ink">{keywordRules[0]?.keyword || "horario"}</span>.</p>
                  </div>
                )}
              </div>
              <form
                className="flex items-center gap-2 border-t border-border/80 bg-background/85 p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!draftMessage.trim()) return;
                  submitPreview(draftMessage);
                  setDraftMessage("");
                }}
              >
                <Input
                  onChange={(event) => setDraftMessage(event.target.value)}
                  placeholder="Escribe hola, 1 o una palabra clave"
                  value={draftMessage}
                />
                <Button disabled={!draftMessage.trim()} size="icon" type="submit">
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
function MenuOptionEditor({ disableDown, disableUp, menuTargets, onChange, onMoveDown, onMoveUp, onRemove, option, position }: { disableDown: boolean; disableUp: boolean; menuTargets: Array<{ key: AutomationKey; label: string; enabled: boolean }>; onChange: (nextOption: MenuOptionView) => void; onMoveDown: () => void; onMoveUp: () => void; onRemove: () => void; option: MenuOptionView; position: number; }) {
  return (
    <div className="grid gap-4 rounded-[1.25rem] border border-border/80 bg-[linear-gradient(180deg,rgba(252,249,241,0.92),rgba(243,245,240,0.86))] p-4 shadow-sm lg:grid-cols-[72px_minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-center">
      <div className="rounded-2xl border border-border bg-background/80 px-3 py-3 text-center">
        <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Opcion</p>
        <p className="mt-2 font-display text-2xl uppercase tracking-[0.08em] text-panel-ink">{position}</p>
      </div>
      <Input onChange={(event) => onChange({ ...option, label: event.target.value })} placeholder="Ej. Reservar cita" value={option.label} />
      <select className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" onChange={(event) => onChange({ ...option, targetKey: event.target.value as AutomationKey })} value={option.targetKey}>
        {menuTargets.map((target) => <option key={target.key} value={target.key}>{target.label}</option>)}
      </select>
      <div className="flex items-center gap-2 justify-self-start lg:justify-self-end">
        <Button disabled={disableUp} onClick={onMoveUp} size="icon" type="button" variant="ghost"><ArrowUp className="h-4 w-4" /></Button>
        <Button disabled={disableDown} onClick={onMoveDown} size="icon" type="button" variant="ghost"><ArrowDown className="h-4 w-4" /></Button>
        <Button onClick={onRemove} type="button" variant="ghost">Quitar</Button>
      </div>
    </div>
  );
}

function KeywordEditor({ keyword, onChange, onRemove, position }: { keyword: KeywordView; onChange: (nextKeyword: KeywordView) => void; onRemove: () => void; position: number; }) {
  return (
    <div className="grid gap-4 rounded-[1.25rem] border border-border/80 bg-[linear-gradient(180deg,rgba(252,249,241,0.92),rgba(243,245,240,0.86))] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-background/80 font-display text-lg uppercase tracking-[0.08em] text-panel-ink">{position}</div>
          <div>
            <p className="font-display text-lg uppercase tracking-[0.08em] text-panel-ink">Palabra clave</p>
            <p className="text-sm text-muted-foreground">Configura una respuesta rapida para una consulta frecuente.</p>
          </div>
        </div>
        <Button onClick={onRemove} type="button" variant="ghost">Quitar</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Input onChange={(event) => onChange({ ...keyword, keyword: event.target.value })} placeholder="horario" value={keyword.keyword} />
        <Input onChange={(event) => onChange({ ...keyword, label: event.target.value })} placeholder="Mostrar horario del negocio" value={keyword.label} />
      </div>
      <textarea className="min-h-[120px] rounded-2xl border border-input bg-background/80 px-4 py-4 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" onChange={(event) => onChange({ ...keyword, response: event.target.value })} placeholder="Escribe la respuesta que recibira el cliente." value={keyword.response} />
    </div>
  );
}

function ChatBubble({ align, children, title }: { align: "left" | "right"; children: ReactNode; title: string }) {
  return (
    <div className={cn("flex", align === "right" ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[86%] rounded-[1.4rem] px-4 py-3 text-sm leading-6 shadow-sm", align === "right" ? "bg-panel-ink text-panel-ivory" : "border border-border/80 bg-background/88 text-panel-ink")}>
        <p className={cn("text-[11px] uppercase tracking-[0.24em]", align === "right" ? "text-panel-ivory/70" : "text-muted-foreground")}>{title}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

function moveItem(items: MenuOptionView[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((entry, index) => ({ ...entry, position: index + 1 }));
}






