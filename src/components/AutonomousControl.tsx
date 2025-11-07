import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bot, Hand, Wifi, WifiOff } from "lucide-react";

interface AutonomousControlProps {
  isConnected: boolean;
  autonomousMode: boolean;
  onToggleAutonomous: (enabled: boolean) => void;
  onEmergencyStop: () => void;
}

export const AutonomousControl = ({
  isConnected,
  autonomousMode,
  onToggleAutonomous,
  onEmergencyStop,
}: AutonomousControlProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5 text-primary" />
                <span className="font-medium">Conectado ao Notebook</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">Desconectado</span>
              </>
            )}
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Autonomous Mode Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="autonomous-mode" className="text-base font-semibold">
                Modo Autônomo
              </Label>
              <p className="text-sm text-muted-foreground">
                O robô desviará automaticamente de obstáculos
              </p>
            </div>
            <Switch
              id="autonomous-mode"
              checked={autonomousMode}
              onCheckedChange={onToggleAutonomous}
              disabled={!isConnected}
            />
          </div>

          {/* Mode Indicator */}
          <div className={`p-4 rounded-lg border-2 transition-colors ${
            autonomousMode 
              ? 'border-primary bg-primary/10' 
              : 'border-border bg-secondary'
          }`}>
            <div className="flex items-center gap-3">
              {autonomousMode ? (
                <>
                  <Bot className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold">Navegação Autônoma Ativa</div>
                    <div className="text-sm text-muted-foreground">
                      O robô está navegando autonomamente usando sensores
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Hand className="w-6 h-6 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">Controle Manual</div>
                    <div className="text-sm text-muted-foreground">
                      Use os controles direcionais para mover o robô
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Stop */}
        <div className="pt-4 border-t border-border">
          <Button
            onClick={onEmergencyStop}
            variant="destructive"
            size="lg"
            className="w-full"
            disabled={!isConnected}
          >
            PARADA DE EMERGÊNCIA
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Pressione para interromper todos os movimentos imediatamente
          </p>
        </div>

        {/* Instructions */}
        {!isConnected && (
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Execute o script <code className="px-1 py-0.5 rounded bg-background">robot_autonomous_control.py</code> no notebook para iniciar o sistema.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
