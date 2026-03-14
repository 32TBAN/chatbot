import { useEffect, useRef, useState } from 'react';
import { Bot, LoaderCircle, MessageSquareText, RefreshCw, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import {
  getInboxConversation,
  getInboxConversations,
  type InboxConversation,
  type InboxConversationDetail,
} from '@/lib/message-inbox';
import { cn } from '@/lib/utils';

const REFRESH_INTERVAL_MS = 8000;

export function HistorySection() {
  const { getAccessToken } = useAuth();
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<InboxConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    const loadInbox = async (showLoader: boolean) => {
      const token = getAccessToken();
      if (!token) {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
        setError('No hay una sesion activa para cargar el historial.');
        return;
      }

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const conversationsResult = await getInboxConversations(token);
      if (!active) return;

      if (!conversationsResult.ok) {
        setError(conversationsResult.message);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const nextConversations = conversationsResult.data;
      setConversations(nextConversations);
      setError(null);

      const preferredCustomerId = nextConversations.some((item) => item.customerId === selectedCustomerId)
        ? selectedCustomerId
        : nextConversations[0]?.customerId ?? null;
      setSelectedCustomerId(preferredCustomerId);

      if (!preferredCustomerId) {
        setSelectedConversation(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const conversationResult = await getInboxConversation(token, preferredCustomerId);
      if (!active) return;

      if (!conversationResult.ok) {
        setError(conversationResult.message);
        setSelectedConversation(null);
      } else {
        setSelectedConversation(conversationResult.data);
      }

      setLoading(false);
      setRefreshing(false);
    };

    void loadInbox(true);
    const intervalId = window.setInterval(() => {
      void loadInbox(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [getAccessToken, selectedCustomerId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !selectedConversation?.messages.length) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [selectedConversation?.customer?.id, selectedConversation?.messages.length]);

  const refreshInbox = async () => {
    const targetCustomerId = selectedCustomerId ?? conversations[0]?.customerId ?? null;
    if (!targetCustomerId) {
      return;
    }

    await selectConversation(targetCustomerId);
  };

  const selectConversation = async (customerId: string) => {
    const token = getAccessToken();
    if (!token) {
      setError('No hay una sesion activa para cargar la conversacion.');
      return;
    }

    setSelectedCustomerId(customerId);
    setRefreshing(true);
    const result = await getInboxConversation(token, customerId);
    setRefreshing(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    setSelectedConversation(result.data);
  };

  if (loading) {
    return (
      <Card className="border-border/80 bg-card shadow-[0_18px_60px_rgba(18,25,36,0.06)]">
        <CardContent className="flex min-h-[360px] items-center justify-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span>Cargando conversaciones de WhatsApp...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="border-border/80 bg-card shadow-[0_18px_60px_rgba(18,25,36,0.06)]">
        <CardContent className="grid gap-4 p-0">
          <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
            <div>
              <p className="font-display text-lg uppercase tracking-[0.08em] text-panel-ink">Conversaciones</p>
              <p className="text-sm text-muted-foreground">Mensajes reales recibidos desde WhatsApp y pruebas de debug.</p>
            </div>
            <Button disabled={!conversations.length} onClick={() => void refreshInbox()} size="icon" type="button" variant="ghost">
              <RefreshCw className={cn('h-4 w-4', refreshing ? 'animate-spin' : '')} />
            </Button>
          </div>

          {conversations.length ? (
            <div className="grid gap-2 px-3 pb-3">
              {conversations.map((conversation) => (
                <button
                  className={cn(
                    'rounded-[1.2rem] border px-4 py-4 text-left transition-all',
                    selectedCustomerId === conversation.customerId
                      ? 'border-panel-ink bg-panel-ink text-panel-ivory shadow-[0_16px_40px_rgba(18,25,36,0.18)]'
                      : 'border-border/80 bg-[linear-gradient(180deg,rgba(251,248,241,0.94),rgba(243,245,240,0.88))] text-panel-ink hover:border-panel-steel/40',
                  )}
                  key={conversation.customerId}
                  onClick={() => void selectConversation(conversation.customerId)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{conversation.customerName || conversation.phone}</p>
                      <p className={cn('text-sm', selectedCustomerId === conversation.customerId ? 'text-panel-ivory/75' : 'text-muted-foreground')}>
                        {conversation.isDebug ? 'Conversacion de prueba' : conversation.customerName ? conversation.phone : 'Contacto desde WhatsApp'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {conversation.isDebug ? <Badge variant="warning">Prueba</Badge> : null}
                      <Badge variant={conversation.lastDirection === 'inbound' ? 'default' : 'success'}>
                        {conversation.lastDirection === 'inbound' ? 'Cliente' : 'Bot'}
                      </Badge>
                    </div>
                  </div>
                  <p className={cn('mt-3 line-clamp-2 text-sm leading-6', selectedCustomerId === conversation.customerId ? 'text-panel-ivory' : 'text-panel-ink')}>
                    {conversation.lastMessage}
                  </p>
                  <div className={cn('mt-4 flex items-center justify-between text-xs uppercase tracking-[0.18em]', selectedCustomerId === conversation.customerId ? 'text-panel-ivory/70' : 'text-muted-foreground')}>
                    <span>{formatTimestamp(conversation.lastMessageAt)}</span>
                    <span>{conversation.messageCount} mensajes</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 px-5 py-8 text-center text-muted-foreground">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-border bg-muted/40">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-panel-ink">Todavia no hay conversaciones registradas.</p>
                <p className="mt-2 text-sm">Cuando el negocio reciba mensajes o ejecutes debug, apareceran aqui automaticamente.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card shadow-[0_18px_60px_rgba(18,25,36,0.06)]">
        <CardContent className="grid min-h-[560px] p-0">
          {error ? (
            <div className="m-5 rounded-2xl border border-rose-300/80 bg-rose-100/85 px-4 py-3 text-sm text-rose-950">
              {error}
            </div>
          ) : null}

          {selectedConversation?.customer ? (
            <>
              <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-panel-ink text-panel-ivory">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-lg uppercase tracking-[0.08em] text-panel-ink">
                      {selectedConversation.customer.name || selectedConversation.customer.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedConversation.customer.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedConversation.customer?.isDebug ? <Badge variant="warning">Prueba</Badge> : null}
                  <Badge variant="success">Solo lectura</Badge>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-[linear-gradient(180deg,rgba(243,247,242,0.92),rgba(253,251,245,0.96))] m-5 mt-0">
                <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <span>Historial completo</span>
                  <span>Vista inicial en los 10 mas recientes</span>
                </div>
                <div className="grid max-h-[min(60vh,540px)] gap-3 overflow-y-auto p-5" ref={messagesContainerRef}>
                  {selectedConversation.messages.length ? selectedConversation.messages.map((message) => (
                    <div className={cn('flex', message.direction === 'outbound' ? 'justify-end' : 'justify-start')} key={message.id}>
                      <div className={cn('max-w-[82%] rounded-[1.4rem] px-4 py-3 text-sm leading-6 shadow-sm', message.direction === 'outbound' ? 'bg-panel-ink text-panel-ivory' : 'border border-border/80 bg-background/92 text-panel-ink')}>
                        <p className={cn('text-[11px] uppercase tracking-[0.24em]', message.direction === 'outbound' ? 'text-panel-ivory/70' : 'text-muted-foreground')}>
                          {message.direction === 'outbound'
                            ? 'Bot'
                            : selectedConversation.customer?.isDebug
                              ? 'Debug inbound'
                              : 'Cliente'}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                        <p className={cn('mt-2 text-[11px]', message.direction === 'outbound' ? 'text-panel-ivory/70' : 'text-muted-foreground')}>
                          {formatTimestamp(message.sentAt, true)}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="grid place-items-center rounded-[1.4rem] border border-dashed border-border/80 bg-background/70 px-6 py-10 text-center text-sm text-muted-foreground">
                      Esta conversacion todavia no tiene mensajes visibles.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="grid place-items-center px-6 py-12 text-center text-muted-foreground">
              <div className="grid max-w-md gap-3">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-border bg-muted/40">
                  <Bot className="h-6 w-6" />
                </div>
                <p className="font-medium text-panel-ink">Selecciona una conversacion para ver el detalle.</p>
                <p className="text-sm">Aqui aparecera el historial completo entre el cliente, el bot y las pruebas de debug.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function formatTimestamp(value: string, detailed = false) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: detailed ? 'short' : undefined,
  }).format(date);
}
