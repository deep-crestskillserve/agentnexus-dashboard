import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export function Settings() {
  const [name, setName] = useState("Jamie Lin");
  const [email] = useState("jamie@acme.com");
  const [notif, setNotif] = useState({ council: true, agent: true, weekly: false });

  return (
    <div className="glass-card-elevated p-6">
      <Tabs defaultValue="profile">
        <TabsList className="bg-black/30">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 max-w-lg space-y-4">
          <Field label="Display name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm focus:border-emerald-500/40 focus:outline-none focus:shadow-[0_0_20px_-6px_rgba(16,185,129,0.5)]"
            />
          </Field>
          <Field label="Email">
            <input
              value={email}
              readOnly
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-muted-foreground"
            />
          </Field>
          <Field label="Role">
            <input
              defaultValue="Workspace owner"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm focus:border-emerald-500/40 focus:outline-none"
            />
          </Field>
          <button
            className="rounded-lg px-4 py-2 text-sm font-semibold text-background shadow-[0_0_24px_-6px_rgba(16,185,129,0.5)]"
            style={{ background: "var(--gradient-emerald)" }}
          >
            Save changes
          </button>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6 max-w-lg space-y-4">
          <Field label="Theme">
            <div className="grid grid-cols-3 gap-2">
              {["Dark", "Midnight", "Aurora"].map((t, i) => (
                <button
                  key={t}
                  className={`rounded-lg border p-4 text-sm transition-all ${
                    i === 0
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-white/10 bg-black/30 hover:border-white/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Toggle
            label="Glassmorphic surfaces"
            description="Heavy backdrop blur on cards and panels."
            checked
          />
          <Toggle label="Reduced motion" description="Disable non-essential animations." />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 max-w-lg space-y-2">
          <Toggle
            label="Council activity"
            description="When a vote concludes or you're tagged."
            checked={notif.council}
            onChange={(v) => setNotif((p) => ({ ...p, council: v }))}
          />
          <Toggle
            label="Agent alerts"
            description="Errors, escalations, and completions."
            checked={notif.agent}
            onChange={(v) => setNotif((p) => ({ ...p, agent: v }))}
          />
          <Toggle
            label="Weekly digest"
            description="A Monday recap of agent + meeting activity."
            checked={notif.weekly}
            onChange={(v) => setNotif((p) => ({ ...p, weekly: v }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 p-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}