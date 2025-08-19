import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const [port, setPort] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');

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

  const moveForward = () => sendCommand(0, 200, -200);
  const moveBackward = () => sendCommand(0, -200, 200);
  const moveRight = () => sendCommand(-200, 0, 200);
  const moveLeft = () => sendCommand(200, -200, 0);
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
