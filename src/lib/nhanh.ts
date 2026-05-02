/**
 * Client gọi API Nhanh.vn — mở rộng theo tài liệu chính thức:
 * https://apidocs.nhanh.vn/
 */
export type NhanhCredentials = {
  appKey: string
  businessId: string
}

type NhanhRequestBody = Record<string, unknown>

export const createNhanhClient = (credentials: NhanhCredentials) => {
  const baseUrl = "https://open.nhanh.vn/api"

  const request = async <T>(
    path: string,
    body: NhanhRequestBody,
  ): Promise<{ ok: boolean; data?: T; error?: string }> => {
    const payload = {
      version: "3.0",
      appKey: credentials.appKey,
      businessId: credentials.businessId,
      ...body,
    }

    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        return { ok: false, error: `HTTP ${res.status}` }
      }

      const json = (await res.json()) as { code?: number; messages?: string[] }
      if (json.code !== undefined && json.code !== 1) {
        return {
          ok: false,
          error: json.messages?.join(", ") ?? `Code ${json.code}`,
        }
      }

      return { ok: true, data: json as T }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Lỗi không xác định"
      return { ok: false, error: message }
    }
  }

  return { request }
}
