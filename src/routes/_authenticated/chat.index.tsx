import { createFileRoute } from "@tanstack/react-router";
import logo from "@/assets/solace-logo.png";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: () => (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="flex flex-col items-center gap-3 opacity-70">
        <img src={logo} alt="" width={56} height={56} />
        <p className="text-sm">Preparing your space…</p>
      </div>
    </div>
  ),
});