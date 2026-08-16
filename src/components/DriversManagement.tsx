import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDrivers,
  getListDriversQueryKey,
  useUpdateDriver,
  type Driver,
} from "@/api";
import { Loader2, KeyRound, Check, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function DriverRow({ driver }: { driver: Driver }) {
  const queryClient = useQueryClient();
  const updateDriver = useUpdateDriver();
  const [name, setName] = useState(driver.displayName ?? "");
  const [password, setPassword] = useState("");
  const [savedField, setSavedField] = useState<"name" | "password" | "active" | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() });

  const flash = (field: "name" | "password" | "active") => {
    setSavedField(field);
    setTimeout(() => setSavedField(null), 1500);
  };

  const saveName = () => {
    updateDriver.mutate(
      { id: driver.id, data: { displayName: name.trim() || null } },
      { onSuccess: () => { invalidate(); flash("name"); } },
    );
  };

  const savePassword = () => {
    if (password.length < 4) return;
    updateDriver.mutate(
      { id: driver.id, data: { password } },
      {
        onSuccess: () => {
          setPassword("");
          invalidate();
          flash("password");
        },
      },
    );
  };

  const toggleActive = (active: boolean) => {
    updateDriver.mutate(
      { id: driver.id, data: { active } },
      { onSuccess: () => { invalidate(); flash("active"); } },
    );
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-bold font-mono">{driver.username}</span>
            {driver.passwordIsDefault && (
              <Badge className="bg-orange-500 text-white border-0">Contraseña por defecto</Badge>
            )}
            {!driver.active && (
              <Badge variant="outline" className="text-destructive border-destructive/40">
                Desactivado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`active-${driver.id}`} className="text-sm text-muted-foreground">
              Activo
            </Label>
            <Switch
              id={`active-${driver.id}`}
              checked={driver.active}
              onCheckedChange={toggleActive}
              data-testid={`switch-active-${driver.id}`}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Nombre visible</Label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del repartidor"
                className="bg-card"
                data-testid={`input-name-${driver.id}`}
              />
              <Button
                variant="outline"
                onClick={saveName}
                disabled={updateDriver.isPending}
                data-testid={`btn-save-name-${driver.id}`}
              >
                {savedField === "name" ? <Check className="w-4 h-4 text-green-500" /> : "Guardar"}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Nueva contraseña (mín. 4)</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="bg-card"
                data-testid={`input-password-${driver.id}`}
              />
              <Button
                onClick={savePassword}
                disabled={updateDriver.isPending || password.length < 4}
                data-testid={`btn-save-password-${driver.id}`}
              >
                {savedField === "password" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DriversManagement() {
  const { data: drivers = [], isLoading } = useListDrivers({
    query: { queryKey: getListDriversQueryKey() },
  });

  return (
    <div>
      <h2 className="font-display text-2xl font-black mb-1">Repartidores</h2>
      <p className="text-muted-foreground mb-6">
        Gestiona los nombres, contraseñas y el estado de cada repartidor.
      </p>
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {drivers.map((driver) => (
            <DriverRow key={driver.id} driver={driver} />
          ))}
        </div>
      )}
    </div>
  );
}
