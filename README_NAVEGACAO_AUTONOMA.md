# Sistema de Navegação Autônoma com Intel RealSense

Sistema completo de controle remoto e navegação autônoma para robô utilizando sensores Intel RealSense L515 (LiDAR) e D435 (câmera RGB-D).

## 📋 Requisitos

### Hardware
- **Notebook** com portas USB 3.0+
- **Intel RealSense L515** (LiDAR)
- **Intel RealSense D435** (Câmera RGB-D)
- **Arduino** conectado ao robô
- **Robô com 3 motores** conforme especificação do projeto

### Software
- Python 3.8+
- Bibliotecas Python (instalação abaixo)
- Navegador web moderno (Chrome, Edge, Firefox)

## 🚀 Instalação

### 1. Instalar Dependências Python

```bash
pip install -r requirements.txt
```

Ou instale manualmente:

```bash
pip install pyrealsense2 pyserial websockets opencv-python numpy
```

### 2. Verificar Sensores

Execute para listar dispositivos RealSense conectados:

```bash
python -c "import pyrealsense2 as rs; ctx = rs.context(); print([dev.get_info(rs.camera_info.name) for dev in ctx.query_devices()])"
```

Deve mostrar: `['Intel RealSense L515', 'Intel RealSense D435']`

### 3. Configurar Arduino

Carregue o código `arduino_robot_control.ino` no Arduino e anote a porta serial (ex: COM3, /dev/ttyUSB0).

## 🎮 Como Usar

### Passo 1: Iniciar o Sistema no Notebook

Execute o script Python principal:

```bash
python robot_autonomous_control.py
```

Você verá:

```
=== Sistema de Controle Autônomo ===

Inicializando sensores...
✓ LiDAR L515 iniciado
✓ Câmera D435 iniciada
✓ Servidor WebSocket rodando em ws://localhost:8765
```

### Passo 2: Abrir Interface Web

1. Abra o navegador e acesse a interface do projeto
2. A interface se conectará automaticamente ao notebook via WebSocket
3. Quando conectado, verá o status "Conectado ao Notebook"

### Passo 3: Conectar ao Arduino

Na interface web:
1. O sistema detectará automaticamente a porta do Arduino
2. Clique em "Conectar Arduino" se necessário
3. Aguarde confirmação de conexão

### Passo 4: Ativar Navegação Autônoma

1. **Modo Manual** (padrão):
   - Use os controles direcionais para mover o robô
   - Ou ajuste a velocidade individual de cada motor

2. **Modo Autônomo**:
   - Ative o switch "Modo Autônomo"
   - O robô começará a navegar automaticamente
   - Desviará de obstáculos detectados pelo LiDAR
   - Override manual disponível a qualquer momento

## 📊 Interface de Visualização

### Câmera D435
- Feed de vídeo em tempo real
- Visualização colorida do ambiente
- Taxa de atualização: ~10 FPS

### Mapa de Obstáculos (LiDAR L515)
Dividido em 3 setores:

- **Esquerda**: Distância e status de obstáculos à esquerda
- **Centro**: Distância e status de obstáculos à frente
- **Direita**: Distância e status de obstáculos à direita

**Cores:**
- 🟢 Verde: Caminho livre (> 0.8m)
- 🔴 Vermelho: Obstáculo detectado (< 0.8m)

## 🤖 Lógica de Navegação Autônoma

### Algoritmo de Desvio

```
1. Verifica setor central
   ├─ Livre? → Avançar
   └─ Bloqueado? → Próximo passo

2. Verifica setor direito
   ├─ Livre? → Virar direita
   └─ Bloqueado? → Próximo passo

3. Verifica setor esquerdo
   ├─ Livre? → Virar esquerda
   └─ Bloqueado? → Recuar

4. Loop a cada 100ms
```

### Parâmetros Ajustáveis

No arquivo `robot_autonomous_control.py`:

```python
# Distância segura (metros)
detector = ObstacleDetector(safe_distance=0.8)

# Velocidades
direction, speed = navigator.decide_movement(obstacles)
# forward: 150
# turn: 120
# backward: 100
```

## 🔧 Configuração Avançada

### Ajustar Sensibilidade do LiDAR

```python
# Em ObstacleDetector.__init__
self.safe_distance = 0.5  # Mais sensível
self.safe_distance = 1.2  # Menos sensível
```

### Ajustar Taxa de Atualização

```python
# Em WebSocketServer.sensor_loop
await asyncio.sleep(0.1)  # 10 Hz (padrão)
await asyncio.sleep(0.05) # 20 Hz (mais rápido)
```

### Ajustar Qualidade do Vídeo

```python
# Em WebSocketServer.sensor_loop
cv2.imencode('.jpg', color_image, [cv2.IMWRITE_JPEG_QUALITY, 50])
#                                                           ↑
#                                                        30-100
```

## 🔥 Resolução de Problemas

### Erro: "Failed to set power state"
**Solução**: Desconecte e reconecte os sensores RealSense

### Erro: "No device connected"
**Solução**: Verifique portas USB 3.0+ e drivers Intel RealSense

### WebSocket não conecta
**Solução**: 
- Verifique se o script Python está rodando
- Confirme que a porta 8765 está livre
- Use `ws://localhost:8765` no código

### Câmera não aparece
**Solução**:
- Verifique logs do Python para erros
- Confirme que o D435 está inicializado corretamente

### LiDAR não detecta obstáculos
**Solução**:
- Verifique se há objetos na frente (mínimo 10cm)
- Confirme que o L515 está inicializado
- Ajuste `safe_distance` se necessário

## 📡 Protocolo de Comunicação

### WebSocket Messages (Python → Interface)

```json
{
  "type": "sensor_data",
  "timestamp": 1234567890.123,
  "camera": "base64_encoded_jpeg",
  "obstacles": {
    "left": false,
    "center": true,
    "right": false,
    "distances": {
      "left": 1.23,
      "center": 0.45,
      "right": 2.10
    }
  }
}
```

### WebSocket Messages (Interface → Python)

```json
// Mover manualmente
{
  "type": "move",
  "m1": 150,
  "m2": 150,
  "m3": 150
}

// Ativar/desativar autônomo
{
  "type": "set_autonomous",
  "enabled": true
}

// Obter portas disponíveis
{
  "type": "get_ports"
}

// Conectar ao Arduino
{
  "type": "connect",
  "port": "COM3"
}
```

## 🎯 Próximos Passos

- [ ] Implementar mapeamento do ambiente (SLAM)
- [ ] Adicionar gravação de trajetos
- [ ] Implementar reconhecimento de objetos com IA
- [ ] Adicionar controle de voz
- [ ] Implementar planejamento de rota A*

## 📚 Documentação Adicional

- [Intel RealSense SDK](https://github.com/IntelRealSense/librealsense)
- [PyRealSense2 Docs](https://intelrealsense.github.io/librealsense/python_docs/)
- [Documentação Técnica Completa](./DOCUMENTACAO_TECNICA.md)

## 🤝 Contribuindo

Sugestões e melhorias são bem-vindas! Veja os arquivos:
- `robot_autonomous_control.py` - Sistema principal
- `src/components/SensorVisualization.tsx` - Interface dos sensores
- `src/components/AutonomousControl.tsx` - Controles de autonomia

---

**Desenvolvido com ❤️ usando Intel RealSense, Python e React**
