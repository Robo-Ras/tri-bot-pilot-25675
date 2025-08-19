import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const [port, setPort] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  const [speed, setSpeed] = useState<number>(80); // Velocidade de 0-100%

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

  const getSpeedValue = () => Math.floor(speed * 2.55); // Converte de 0-100% para 0-255

  const moveForward = () => sendCommand(0, getSpeedValue(), -getSpeedValue());
  const moveBackward = () => sendCommand(0, -getSpeedValue(), getSpeedValue());
  const moveRight = () => sendCommand(-getSpeedValue(), 0, getSpeedValue());
  const moveLeft = () => sendCommand(getSpeedValue(), -getSpeedValue(), 0);
  const stop = () => sendCommand(0, 0, 0);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isConnected) return;

      switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          moveForward();
          break;
        case 's':
        case 'arrowdown':
          moveBackward();
          break;
        case 'a':
        case 'arrowleft':
          moveLeft();
          break;
        case 'd':
        case 'arrowright':
          moveRight();
          break;
        case ' ':
          event.preventDefault();
          stop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isConnected]);

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

          {isConnected && (
            <>
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm font-medium">Velocidade: {speed}%</p>
                </div>
                <Slider
                  value={[speed]}
                  onValueChange={(value) => setSpeed(value[0])}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 flex justify-center">
                  <Button onClick={moveForward} size="lg" className="w-20">
                    ↑
                  </Button>
                </div>
                
                <Button onClick={moveLeft} size="lg" className="w-20">
                  ←
                </Button>
                <Button onClick={stop} size="lg" variant="destructive" className="w-20">
                  PARE
                </Button>
                <Button onClick={moveRight} size="lg" className="w-20">
                  →
                </Button>

                <div className="col-span-3 flex justify-center">
                  <Button onClick={moveBackward} size="lg" className="w-20">
                    ↓
                  </Button>
                </div>
              </div>
            </>
          )}

          {isConnected && (
            <div className="text-sm text-muted-foreground text-center">
              <p>Controle por teclado:</p>
              <p>WASD ou setas direcionais + Espaço para parar</p>
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
