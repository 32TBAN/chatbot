import { LoaderCircle, PackageSearch, Plus, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  uploadProductMedia,
  type ProductView,
} from "@/services/products-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DraftProduct = Omit<ProductView, "id"> & { id: string };

function createEmptyDraft(): DraftProduct {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    description: "",
    price: null,
    currency: "USD",
    stock: 0,
    isActive: true,
    mediaType: null,
    mediaUrl: null,
    mediaFilename: null,
    whatsappCaption: "",
  };
}

function toDraft(product: ProductView): DraftProduct {
  return {
    ...product,
    description: product.description ?? "",
    currency: product.currency ?? "USD",
    whatsappCaption: product.whatsappCaption ?? "",
  };
}

export function CatalogSection() {
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<DraftProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ tone: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = getAccessToken();
      if (!token) {
        if (!active) return;
        setLoading(false);
        setStatus({ tone: "error", message: "No hay una sesion activa para cargar el catalogo." });
        return;
      }

      const result = await getProducts(token);
      if (!active) return;

      setLoading(false);
      if (!result.ok) {
        setStatus({ tone: "error", message: result.message });
        return;
      }

      setItems(result.data.map(toDraft));
    };

    void load();
    return () => {
      active = false;
    };
  }, [getAccessToken]);

  const updateDraft = (id: string, update: Partial<DraftProduct>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...update } : item)));
  };

  const saveProduct = async (item: DraftProduct) => {
    const token = getAccessToken();
    if (!token) {
      setStatus({ tone: "error", message: "No hay una sesion activa para guardar el producto." });
      return;
    }

    if (!item.name.trim()) {
      setStatus({ tone: "error", message: "Cada producto debe tener nombre." });
      return;
    }

    setSavingId(item.id);
    setStatus(null);

    const payload = {
      name: item.name.trim(),
      description: item.description?.trim() || null,
      price: item.price,
      currency: item.currency?.trim() || "USD",
      stock: item.stock,
      isActive: item.isActive,
      whatsappCaption: item.whatsappCaption?.trim() || null,
    };

    const result = item.id.startsWith("draft-")
      ? await createProduct(token, payload)
      : await updateProduct(token, item.id, payload);

    setSavingId(null);

    if (!result.ok) {
      setStatus({ tone: "error", message: result.message });
      return;
    }

    setItems((current) => current.map((entry) => (entry.id === item.id ? toDraft(result.data) : entry)));
    setStatus({ tone: "success", message: `Producto ${item.id.startsWith("draft-") ? "creado" : "actualizado"} correctamente.` });
  };

  const removeProduct = async (item: DraftProduct) => {
    if (item.id.startsWith("draft-")) {
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setStatus({ tone: "error", message: "No hay una sesion activa para eliminar el producto." });
      return;
    }

    setSavingId(item.id);
    const result = await deleteProduct(token, item.id);
    setSavingId(null);

    if (!result.ok) {
      setStatus({ tone: "error", message: result.message });
      return;
    }

    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setStatus({ tone: "success", message: "Producto eliminado del catalogo." });
  };

  const handleMediaUpload = async (item: DraftProduct, file: File | null) => {
    if (!file) return;

    const token = getAccessToken();
    if (!token) {
      setStatus({ tone: "error", message: "No hay una sesion activa para subir media del producto." });
      return;
    }

    if (item.id.startsWith("draft-")) {
      setStatus({ tone: "error", message: "Guarda el producto antes de subir imagen o video." });
      return;
    }

    setUploadingId(item.id);
    const result = await uploadProductMedia(token, item.id, file);
    setUploadingId(null);

    if (!result.ok) {
      setStatus({ tone: "error", message: result.message });
      return;
    }

    setItems((current) => current.map((entry) => (entry.id === item.id ? toDraft(result.data) : entry)));
    setStatus({ tone: "success", message: "Media del producto actualizada correctamente." });
  };

  if (loading) {
    return (
      <section className="grid gap-6">
        <Card className="shadow-[0_20px_70px_rgba(18,25,36,0.08)]">
          <CardContent className="flex min-h-[220px] items-center justify-center gap-3 text-muted-foreground">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Cargando catalogo...</span>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <Card className="border-border/80 bg-card shadow-[0_18px_60px_rgba(18,25,36,0.06)]">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardDescription>Catalogo para WhatsApp</CardDescription>
            <CardTitle>Productos con imagen, video y caption</CardTitle>
          </div>
          <Button onClick={() => setItems((current) => [createEmptyDraft(), ...current])} type="button" variant="secondary">
            <Plus className="h-4 w-4" />
            Agregar producto
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4">
          {status ? (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${status.tone === "success" ? "border-emerald-300/70 bg-emerald-100/85 text-emerald-950" : "border-rose-300/80 bg-rose-100/85 text-rose-950"}`}>
              {status.message}
            </div>
          ) : null}

          {!items.length ? (
            <div className="grid gap-3 rounded-[1.25rem] border border-dashed border-border/80 bg-background/75 px-5 py-8 text-center">
              <PackageSearch className="mx-auto h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-panel-ink">Aun no hay productos configurados</p>
                <p className="mt-1 text-sm text-muted-foreground">Crea productos aqui para que el bot pueda enviarlos con texto e imagen o video.</p>
              </div>
            </div>
          ) : null}

          {items.map((item) => (
            <article className="grid gap-4 rounded-[1.35rem] border border-border/80 bg-[linear-gradient(180deg,rgba(251,248,241,0.95),rgba(243,245,240,0.9))] p-5 shadow-sm xl:grid-cols-[minmax(0,1.2fr)_280px]" key={item.id}>
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={item.isActive ? "success" : "default"}>{item.isActive ? "Activo" : "Oculto"}</Badge>
                  {item.mediaType ? <Badge variant="default">{item.mediaType === "image" ? "Imagen" : "Video"}</Badge> : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-panel-ink">
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Nombre</span>
                    <Input onChange={(event) => updateDraft(item.id, { name: event.target.value })} value={item.name} />
                  </label>
                  <label className="grid gap-2 text-sm text-panel-ink">
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Moneda</span>
                    <Input onChange={(event) => updateDraft(item.id, { currency: event.target.value.toUpperCase() })} value={item.currency ?? "USD"} />
                  </label>
                  <label className="grid gap-2 text-sm text-panel-ink">
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Precio</span>
                    <Input onChange={(event) => updateDraft(item.id, { price: event.target.value ? Number(event.target.value) : null })} type="number" value={item.price ?? ""} />
                  </label>
                  <label className="grid gap-2 text-sm text-panel-ink">
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Stock</span>
                    <Input onChange={(event) => updateDraft(item.id, { stock: event.target.value ? Number(event.target.value) : 0 })} type="number" value={item.stock ?? 0} />
                  </label>
                </div>

                <label className="grid gap-2 text-sm text-panel-ink">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Descripcion</span>
                  <textarea className="min-h-[92px] rounded-md border border-input bg-muted/45 px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" onChange={(event) => updateDraft(item.id, { description: event.target.value })} value={item.description ?? ""} />
                </label>

                <label className="grid gap-2 text-sm text-panel-ink">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Caption para WhatsApp</span>
                  <textarea className="min-h-[112px] rounded-md border border-input bg-muted/45 px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" onChange={(event) => updateDraft(item.id, { whatsappCaption: event.target.value })} value={item.whatsappCaption ?? ""} />
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-panel-ink">
                    <input checked={item.isActive} onChange={(event) => updateDraft(item.id, { isActive: event.target.checked })} type="checkbox" />
                    Visible para el bot
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button disabled={savingId === item.id} onClick={() => saveProduct(item)} type="button">
                    {savingId === item.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar
                  </Button>
                  <Button disabled={savingId === item.id} onClick={() => removeProduct(item)} type="button" variant="ghost">
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 rounded-[1.15rem] border border-border/80 bg-background/80 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Media del producto</p>
                  <p className="mt-1 text-sm text-muted-foreground">Sube una imagen o video corto para enviarlo por WhatsApp.</p>
                </div>
                <Input accept="image/*,video/*" disabled={uploadingId === item.id} onChange={(event) => void handleMediaUpload(item, event.target.files?.[0] ?? null)} type="file" />
                <p className="text-xs text-muted-foreground">
                  {uploadingId === item.id ? "Subiendo media..." : item.mediaFilename ? `Archivo actual: ${item.mediaFilename}` : "Aun no hay media cargada."}
                </p>
                <div className="overflow-hidden rounded-2xl border border-border bg-muted/20">
                  {item.mediaUrl ? item.mediaType === "video" ? (
                    <video className="h-56 w-full bg-black object-cover" controls src={item.mediaUrl} />
                  ) : (
                    <img alt={item.name} className="h-56 w-full object-cover" src={item.mediaUrl} />
                  ) : (
                    <div className="grid h-56 place-items-center px-6 text-center text-sm text-muted-foreground">
                      <div>
                        <Upload className="mx-auto mb-3 h-7 w-7" />
                        <p>La vista previa aparecera aqui cuando cargues una imagen o video.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

