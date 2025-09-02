import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import MotorSpeedControl from '@/components/MotorSpeedControl';
import DirectionalControl from '@/components/DirectionalControl';

type ControlMode = 'select' | 'motor' | 'directional';

const Index = () => {
  const [port, setPort] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [controlMode, setControlMode] = useState<ControlMode>('select');

  // Verifica se o navegador suporta WebSerial
  const isWebSerialSupported = 'serial' in navigator;

  const connectToArduino = async () => {
    try {
      if (!isWebSerialSupported) {
        throw new Error('WebSerial não é suportado neste navegador');
      }

      const selectedPort = await (navigator as any).serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });
      
      setPort(selectedPort);
      setIsConnected(true);
      setError('');
    } catch (err) {
      setError(`Erro na conexão: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };

  const sendCommand = async (m1: number, m2: number, m3: number) => {
    if (!port || !isConnected) return;

    try {
      const writer = port.writable?.getWriter();
      if (writer) {
        const command = `${m1},${m2},${m3}\n`;
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(command));
        writer.releaseLock();
      }
    } catch (err) {
      setError(`Erro ao enviar comando: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Controle do Robô</CardTitle>
          <CardDescription>
            Interface Web para controlar robô via Arduino
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
            
            {!isWebSerialSupported && (
              <Alert>
                <AlertDescription>
                  WebSerial não é suportado neste navegador. Use Chrome/Edge mais recente.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isConnected && isWebSerialSupported && (
              <Button onClick={connectToArduino} className="w-full">
                Conectar Arduino
              </Button>
            )}
          </div>

          {isConnected && controlMode === 'select' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Escolha o modo de controle</h3>
              <div className="grid grid-cols-1 gap-4">
                <Button onClick={() => setControlMode('motor')} size="lg" className="w-full">
                  Controle de Velocidade por Motor
                </Button>
                <Button onClick={() => setControlMode('directional')} size="lg" variant="outline" className="w-full">
                  Controle Direcional
                </Button>
              </div>
            </div>
          )}

          {isConnected && controlMode === 'motor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button onClick={() => setControlMode('select')} variant="outline" size="sm">
                  ← Voltar
                </Button>
                <h3 className="text-lg font-semibold">Controle por Motor</h3>
                <div></div>
              </div>
              <MotorSpeedControl onSendCommand={sendCommand} />
            </div>
          )}

          {isConnected && controlMode === 'directional' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button onClick={() => setControlMode('select')} variant="outline" size="sm">
                  ← Voltar
                </Button>
                <h3 className="text-lg font-semibold">Controle Direcional</h3>
                <div></div>
              </div>
              <DirectionalControl onSendCommand={sendCommand} />
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Arquivos criados:</strong></p>
            <p>• robot_control.py - Interface Python</p>
            <p>• arduino_robot_control.ino - Código Arduino</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
