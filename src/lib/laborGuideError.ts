export function laborGuideFailure(payload: unknown): { message: string; models: string[] } {
  const p = payload as { error?: string; status?: number; detail?: { error?: { code?: string; message?: string; availableModels?: unknown } } } | null;
  const provider = p?.detail?.error;
  const models = Array.isArray(provider?.availableModels)
    ? provider.availableModels.filter((v): v is string => typeof v === 'string' && v.length > 0) : [];
  if (provider?.code === 'MODEL_OR_VARIANT_NOT_FOUND') {
    return { message: 'The saved model does not match Open Labor Project. Select the exact guide model to retry.', models };
  }
  return { message: provider?.message || p?.error || 'Labor lookup failed. Please try again.', models };
}