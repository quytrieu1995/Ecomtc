import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getNhanhConfig, saveNhanhConfig } from "@/server/nhanh-config"
import { AlertTriangle } from "lucide-react"

export default async function SettingsPage() {
  const cfg = await getNhanhConfig()

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cài đặt Nhanh.vn</h1>
        <p className="text-sm text-muted-foreground">
          Lưu AppKey và BusinessId để gọi API (Open API)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin kết nối</CardTitle>
          <CardDescription>
            Không chia sẻ khóa công khai; lưu cục bộ trong SQLite qua Prisma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <AlertTriangle className="size-5 shrink-0" aria-hidden />
            <p>
              Trên môi trường thật nên mã hoá bí mật hoặc dùng biến môi trường cho khóa API.
            </p>
          </div>

          <form action={saveNhanhConfig} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="appKey">AppKey</Label>
              <Input
                id="appKey"
                name="appKey"
                required
                defaultValue={cfg?.appKey ?? ""}
                autoComplete="off"
                placeholder="AppKey từ Nhanh.vn"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessId">BusinessId</Label>
              <Input
                id="businessId"
                name="businessId"
                required
                defaultValue={cfg?.businessId ?? ""}
                autoComplete="off"
                placeholder="ID doanh nghiệp"
              />
            </div>
            <Button type="submit">Lưu cấu hình</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
