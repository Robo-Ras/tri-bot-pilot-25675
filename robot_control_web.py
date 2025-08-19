from flask import Flask, render_template_string, request, jsonify
import serial
import serial.tools.list_ports
import time
import threading

app = Flask(__name__)

class RobotController:
    def __init__(self):
        self.serial_connection = None
        self.speed = 200
        self.is_connected = False
        
    def get_available_ports(self):
        return [port.device for port in serial.tools.list_ports.comports()]
    
    def connect_serial(self, port):
        try:
            if self.serial_connection and self.serial_connection.is_open:
                self.serial_connection.close()
            
            self.serial_connection = serial.Serial(port, 9600, timeout=1)
            time.sleep(2)  # Aguarda o Arduino resetar
            self.is_connected = True
            return True, "Conectado com sucesso"
        except Exception as e:
            self.is_connected = False
            return False, f"Erro: {str(e)}"
    
    def send_command(self, m1, m2, m3):
        if self.serial_connection and self.serial_connection.is_open:
            try:
                command = f"{m1},{m2},{m3}\n"
                self.serial_connection.write(command.encode())
                return True, f"Enviado: M1={m1}, M2={m2}, M3={m3}"
            except Exception as e:
                return False, f"Erro ao enviar comando: {e}"
        return False, "Não conectado"
    
    def move_forward(self):
        return self.send_command(0, self.speed, -self.speed)
    
    def move_backward(self):
        return self.send_command(0, -self.speed, self.speed)
    
    def move_right(self):
        return self.send_command(-self.speed, 0, self.speed)
    
    def move_left(self):
        return self.send_command(self.speed, -self.speed, 0)
    
    def stop(self):
        return self.send_command(0, 0, 0)

robot = RobotController()

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Controle do Robô</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f0f0f0;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .connection-section {
            margin-bottom: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .status {
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            text-align: center;
            font-weight: bold;
        }
        .status.connected {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.disconnected {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .control-section {
            margin-top: 30px;
        }
        .controls {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            max-width: 300px;
            margin: 0 auto;
        }
        .btn {
            padding: 15px;
            font-size: 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: bold;
        }
        .btn:hover {
            transform: scale(1.05);
        }
        .btn:active {
            transform: scale(0.95);
        }
        .btn-primary {
            background: #007bff;
            color: white;
        }
        .btn-primary:hover {
            background: #0056b3;
        }
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        .btn-danger:hover {
            background: #c82333;
        }
        .btn-success {
            background: #28a745;
            color: white;
        }
        .btn-success:hover {
            background: #1e7e34;
        }
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        .btn-secondary:hover {
            background: #545b62;
        }
        .forward-btn {
            grid-column: 2;
        }
        .left-btn {
            grid-column: 1;
            grid-row: 2;
        }
        .stop-btn {
            grid-column: 2;
            grid-row: 2;
        }
        .right-btn {
            grid-column: 3;
            grid-row: 2;
        }
        .backward-btn {
            grid-column: 2;
            grid-row: 3;
        }
        .speed-control {
            margin: 20px 0;
            text-align: center;
        }
        .speed-slider {
            width: 100%;
            margin: 10px 0;
        }
        .form-group {
            margin: 10px 0;
        }
        .form-control {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .keyboard-info {
            margin-top: 20px;
            padding: 15px;
            background: #e9ecef;
            border-radius: 8px;
            font-size: 14px;
        }
        #message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
            display: none;
        }
        .message-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .message-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Controle do Robô</h1>
            <p>Interface Web para controle via Arduino</p>
        </div>

        <div class="connection-section">
            <h3>Conexão Serial</h3>
            <div class="form-group">
                <select id="portSelect" class="form-control">
                    <option value="">Selecione uma porta...</option>
                </select>
            </div>
            <button onclick="refreshPorts()" class="btn btn-secondary">🔄 Atualizar Portas</button>
            <button onclick="connectArduino()" class="btn btn-success">🔗 Conectar</button>
            <div id="connectionStatus" class="status disconnected">Desconectado</div>
        </div>

        <div class="speed-control">
            <h3>Velocidade: <span id="speedValue">200</span></h3>
            <input type="range" id="speedSlider" class="speed-slider" min="0" max="255" value="200" onchange="updateSpeed()">
        </div>

        <div id="message"></div>

        <div class="control-section">
            <h3>Controles de Movimento</h3>
            <div class="controls">
                <button class="btn btn-primary forward-btn" onclick="moveForward()">⬆️ FRENTE</button>
                <button class="btn btn-primary left-btn" onclick="moveLeft()">⬅️ ESQUERDA</button>
                <button class="btn btn-danger stop-btn" onclick="stop()">⏹️ PARE</button>
                <button class="btn btn-primary right-btn" onclick="moveRight()">➡️ DIREITA</button>
                <button class="btn btn-primary backward-btn" onclick="moveBackward()">⬇️ TRÁS</button>
            </div>
        </div>

        <div class="keyboard-info">
            <h4>⌨️ Controle por Teclado:</h4>
            <p><strong>W/↑:</strong> Frente | <strong>S/↓:</strong> Trás | <strong>A/←:</strong> Esquerda | <strong>D/→:</strong> Direita | <strong>Espaço:</strong> Parar</p>
        </div>
    </div>

    <script>
        let isConnected = false;
        let speed = 200;

        // Carrega portas disponíveis ao iniciar
        window.onload = function() {
            refreshPorts();
        };

        function showMessage(text, isError = false) {
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = text;
            messageDiv.className = isError ? 'message-error' : 'message-success';
            messageDiv.style.display = 'block';
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
        }

        function refreshPorts() {
            fetch('/api/ports')
                .then(response => response.json())
                .then(data => {
                    const select = document.getElementById('portSelect');
                    select.innerHTML = '<option value="">Selecione uma porta...</option>';
                    data.ports.forEach(port => {
                        const option = document.createElement('option');
                        option.value = port;
                        option.textContent = port;
                        select.appendChild(option);
                    });
                })
                .catch(error => showMessage('Erro ao buscar portas: ' + error, true));
        }

        function connectArduino() {
            const port = document.getElementById('portSelect').value;
            if (!port) {
                showMessage('Selecione uma porta primeiro!', true);
                return;
            }

            fetch('/api/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ port: port })
            })
            .then(response => response.json())
            .then(data => {
                isConnected = data.success;
                const status = document.getElementById('connectionStatus');
                if (data.success) {
                    status.className = 'status connected';
                    status.textContent = 'Conectado';
                    showMessage(data.message);
                } else {
                    status.className = 'status disconnected';
                    status.textContent = 'Desconectado';
                    showMessage(data.message, true);
                }
            })
            .catch(error => showMessage('Erro na conexão: ' + error, true));
        }

        function updateSpeed() {
            speed = document.getElementById('speedSlider').value;
            document.getElementById('speedValue').textContent = speed;
        }

        function sendCommand(action) {
            if (!isConnected) {
                showMessage('Arduino não conectado!', true);
                return;
            }

            fetch('/api/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: action, speed: speed })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    showMessage(data.message, true);
                }
            })
            .catch(error => showMessage('Erro ao enviar comando: ' + error, true));
        }

        function moveForward() { sendCommand('forward'); }
        function moveBackward() { sendCommand('backward'); }
        function moveLeft() { sendCommand('left'); }
        function moveRight() { sendCommand('right'); }
        function stop() { sendCommand('stop'); }

        // Controle por teclado
        document.addEventListener('keydown', function(event) {
            if (!isConnected) return;

            switch(event.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    event.preventDefault();
                    moveForward();
                    break;
                case 's':
                case 'arrowdown':
                    event.preventDefault();
                    moveBackward();
                    break;
                case 'a':
                case 'arrowleft':
                    event.preventDefault();
                    moveLeft();
                    break;
                case 'd':
                case 'arrowright':
                    event.preventDefault();
                    moveRight();
                    break;
                case ' ':
                    event.preventDefault();
                    stop();
                    break;
            }
        });
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/ports')
def get_ports():
    ports = robot.get_available_ports()
    return jsonify({'ports': ports})

@app.route('/api/connect', methods=['POST'])
def connect():
    data = request.json
    port = data.get('port')
    success, message = robot.connect_serial(port)
    return jsonify({'success': success, 'message': message})

@app.route('/api/move', methods=['POST'])
def move():
    data = request.json
    action = data.get('action')
    speed = int(data.get('speed', 200))
    
    robot.speed = speed
    
    if action == 'forward':
        success, message = robot.move_forward()
    elif action == 'backward':
        success, message = robot.move_backward()
    elif action == 'left':
        success, message = robot.move_left()
    elif action == 'right':
        success, message = robot.move_right()
    elif action == 'stop':
        success, message = robot.stop()
    else:
        success, message = False, "Comando inválido"
    
    return jsonify({'success': success, 'message': message})

if __name__ == '__main__':
    print("🤖 Servidor do Robô iniciando...")
    print("📡 Acesse: http://localhost:5000")
    print("🔧 Certifique-se de que o Arduino está conectado!")
    app.run(debug=True, host='0.0.0.0', port=5000)