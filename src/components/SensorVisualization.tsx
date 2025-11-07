import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ObstacleData {
  left: boolean;
  center: boolean;
  right: boolean;
  distances: {
    left: number;
    center: number;
    right: number;
  };
}

interface SensorVisualizationProps {
  cameraImage?: string;
  obstacles?: ObstacleData;
}

export const SensorVisualization = ({ cameraImage, obstacles }: SensorVisualizationProps) => {
  return (
    <div className="space-y-4">
      {/* Camera Feed */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Câmera D435</h3>
        <div className="aspect-video bg-secondary rounded-lg overflow-hidden">
          {cameraImage ? (
            <img 
              src={`data:image/jpeg;base64,${cameraImage}`} 
              alt="Camera feed"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Aguardando dados da câmera...
            </div>
          )}
        </div>
      </Card>

      {/* LiDAR Obstacle Map */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Mapa de Obstáculos - LiDAR L515</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {/* Left Sector */}
            <div className={`p-4 rounded-lg border-2 transition-colors ${
              obstacles?.left 
                ? 'border-destructive bg-destructive/10' 
                : 'border-border bg-secondary'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Esquerda</span>
                {obstacles?.left ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="text-2xl font-bold">
                {obstacles?.distances.left.toFixed(2) ?? '--'}m
              </div>
            </div>

            {/* Center Sector */}
            <div className={`p-4 rounded-lg border-2 transition-colors ${
              obstacles?.center 
                ? 'border-destructive bg-destructive/10' 
                : 'border-border bg-secondary'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Centro</span>
                {obstacles?.center ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="text-2xl font-bold">
                {obstacles?.distances.center.toFixed(2) ?? '--'}m
              </div>
            </div>

            {/* Right Sector */}
            <div className={`p-4 rounded-lg border-2 transition-colors ${
              obstacles?.right 
                ? 'border-destructive bg-destructive/10' 
                : 'border-border bg-secondary'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Direita</span>
                {obstacles?.right ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="text-2xl font-bold">
                {obstacles?.distances.right.toFixed(2) ?? '--'}m
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Livre (&gt; 0.8m)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-muted-foreground">Obstáculo (&lt; 0.8m)</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Status Summary */}
      {obstacles && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status Geral</span>
            {!obstacles.left && !obstacles.center && !obstacles.right ? (
              <Badge variant="default" className="bg-primary">
                Caminho Livre
              </Badge>
            ) : (
              <Badge variant="destructive">
                Obstáculos Detectados
              </Badge>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
