"""
Sistema de Controle Autônomo com Intel RealSense L515 e D435
Processa dados dos sensores e implementa navegação com desvio de obstáculos
"""

import pyrealsense2 as rs
import numpy as np
import serial
import serial.tools.list_ports
import asyncio
import websockets
import json
import cv2
import base64
from threading import Thread
from queue import Queue

class RealSenseController:
    """Gerencia os sensores Intel RealSense"""
    
    def __init__(self):
        self.pipeline_lidar = rs.pipeline()
        self.pipeline_camera = rs.pipeline()
        self.config_lidar = rs.config()
        self.config_camera = rs.config()
        
        # Configuração do LiDAR L515
        self.config_lidar.enable_device_serial_number(self.get_device_serial('L515'))
        self.config_lidar.enable_stream(rs.stream.depth, 1024, 768, rs.format.z16, 30)
        
        # Configuração da Câmera D435
        self.config_camera.enable_device_serial_number(self.get_device_serial('D435'))
        self.config_camera.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
        self.config_camera.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
        
        self.lidar_started = False
        self.camera_started = False
        
    def get_device_serial(self, device_type):
        """Obtém o serial number do dispositivo"""
        ctx = rs.context()
        devices = ctx.query_devices()
        for dev in devices:
            name = dev.get_info(rs.camera_info.name)
            if device_type in name:
                return dev.get_info(rs.camera_info.serial_number)
        return None
    
    def start(self):
        """Inicia os sensores"""
        try:
            self.pipeline_lidar.start(self.config_lidar)
            self.lidar_started = True
            print("✓ LiDAR L515 iniciado")
        except Exception as e:
            print(f"✗ Erro ao iniciar LiDAR: {e}")
            
        try:
            self.pipeline_camera.start(self.config_camera)
            self.camera_started = True
            print("✓ Câmera D435 iniciada")
        except Exception as e:
            print(f"✗ Erro ao iniciar câmera: {e}")
    
    def get_lidar_data(self):
        """Obtém dados do LiDAR"""
        if not self.lidar_started:
            return None
            
        frames = self.pipeline_lidar.wait_for_frames()
        depth_frame = frames.get_depth_frame()
        if not depth_frame:
            return None
            
        # Converte para numpy array
        depth_image = np.asanyarray(depth_frame.get_data())
        return depth_image
    
    def get_camera_data(self):
        """Obtém dados da câmera"""
        if not self.camera_started:
            return None, None
            
        frames = self.pipeline_camera.wait_for_frames()
        color_frame = frames.get_color_frame()
        depth_frame = frames.get_depth_frame()
        
        if not color_frame or not depth_frame:
            return None, None
            
        color_image = np.asanyarray(color_frame.get_data())
        depth_image = np.asanyarray(depth_frame.get_data())
        
        return color_image, depth_image
    
    def stop(self):
        """Para os sensores"""
        if self.lidar_started:
            self.pipeline_lidar.stop()
        if self.camera_started:
            self.pipeline_camera.stop()


class ObstacleDetector:
    """Detecta obstáculos usando dados dos sensores"""
    
    def __init__(self, safe_distance=0.5):
        self.safe_distance = safe_distance  # metros
        
    def analyze_lidar(self, depth_image):
        """Analisa dados do LiDAR para detectar obstáculos"""
        if depth_image is None:
            return {'safe': True, 'direction': 'forward'}
        
        # Converte para metros
        depth_meters = depth_image * 0.001
        
        # Divide a imagem em setores (esquerda, centro, direita)
        height, width = depth_meters.shape
        left_sector = depth_meters[:, :width//3]
        center_sector = depth_meters[:, width//3:2*width//3]
        right_sector = depth_meters[:, 2*width//3:]
        
        # Calcula distância mínima em cada setor
        left_min = np.min(left_sector[left_sector > 0])
        center_min = np.min(center_sector[center_sector > 0])
        right_min = np.min(right_sector[right_sector > 0])
        
        obstacles = {
            'left': left_min < self.safe_distance,
            'center': center_min < self.safe_distance,
            'right': right_min < self.safe_distance,
            'distances': {
                'left': float(left_min),
                'center': float(center_min),
                'right': float(right_min)
            }
        }
        
        return obstacles


class AutonomousNavigator:
    """Sistema de navegação autônoma"""
    
    def __init__(self, obstacle_detector):
        self.detector = obstacle_detector
        self.current_state = 'idle'
        
    def decide_movement(self, obstacles):
        """Decide o movimento baseado nos obstáculos"""
        if not obstacles['center']:
            # Caminho livre à frente
            return 'forward', 150
        elif not obstacles['right']:
            # Desviar para direita
            return 'right', 120
        elif not obstacles['left']:
            # Desviar para esquerda
            return 'left', 120
        else:
            # Obstáculos em todos os lados - recuar
            return 'backward', 100


class RobotController:
    """Controla o robô via Arduino"""
    
    def __init__(self):
        self.serial_port = None
        self.speed = 150
        
    def connect(self, port):
        """Conecta ao Arduino"""
        try:
            self.serial_port = serial.Serial(port, 9600, timeout=1)
            print(f"✓ Conectado ao Arduino na porta {port}")
            return True
        except Exception as e:
            print(f"✗ Erro ao conectar: {e}")
            return False
    
    def send_command(self, m1, m2, m3):
        """Envia comando para o Arduino"""
        if not self.serial_port:
            return False
            
        command = f"{m1},{m2},{m3}\n"
        try:
            self.serial_port.write(command.encode())
            return True
        except Exception as e:
            print(f"✗ Erro ao enviar comando: {e}")
            return False
    
    def move(self, direction, speed):
        """Move o robô na direção especificada"""
        if direction == 'forward':
            return self.send_command(speed, speed, speed)
        elif direction == 'backward':
            return self.send_command(-speed, -speed, -speed)
        elif direction == 'left':
            return self.send_command(-speed, speed, 0)
        elif direction == 'right':
            return self.send_command(speed, -speed, 0)
        elif direction == 'stop':
            return self.send_command(0, 0, 0)
        return False
    
    def get_available_ports(self):
        """Lista portas seriais disponíveis"""
        ports = serial.tools.list_ports.comports()
        return [port.device for port in ports]


class WebSocketServer:
    """Servidor WebSocket para comunicação com interface web"""
    
    def __init__(self, robot_controller, realsense_controller, obstacle_detector, navigator):
        self.robot = robot_controller
        self.sensors = realsense_controller
        self.detector = obstacle_detector
        self.navigator = navigator
        self.clients = set()
        self.autonomous_mode = False
        self.running = True
        
    async def register(self, websocket):
        """Registra novo cliente"""
        self.clients.add(websocket)
        print(f"✓ Cliente conectado. Total: {len(self.clients)}")
        
    async def unregister(self, websocket):
        """Remove cliente"""
        self.clients.remove(websocket)
        print(f"✗ Cliente desconectado. Total: {len(self.clients)}")
    
    async def send_to_all(self, message):
        """Envia mensagem para todos os clientes"""
        if self.clients:
            await asyncio.gather(
                *[client.send(json.dumps(message)) for client in self.clients],
                return_exceptions=True
            )
    
    async def handle_client(self, websocket, path):
        """Gerencia comunicação com cliente"""
        await self.register(websocket)
        try:
            async for message in websocket:
                data = json.loads(message)
                await self.process_command(data)
        finally:
            await self.unregister(websocket)
    
    async def process_command(self, data):
        """Processa comandos recebidos"""
        cmd_type = data.get('type')
        
        if cmd_type == 'connect':
            port = data.get('port')
            success = self.robot.connect(port)
            await self.send_to_all({'type': 'connection', 'status': success})
            
        elif cmd_type == 'move':
            direction = data.get('direction')
            speed = data.get('speed', 150)
            self.robot.move(direction, speed)
            
        elif cmd_type == 'set_autonomous':
            self.autonomous_mode = data.get('enabled', False)
            await self.send_to_all({'type': 'autonomous_status', 'enabled': self.autonomous_mode})
            
        elif cmd_type == 'get_ports':
            ports = self.robot.get_available_ports()
            await self.send_to_all({'type': 'ports', 'ports': ports})
    
    async def sensor_loop(self):
        """Loop principal de processamento dos sensores"""
        while self.running:
            # Obtém dados dos sensores
            lidar_data = self.sensors.get_lidar_data()
            color_image, camera_depth = self.sensors.get_camera_data()
            
            # Detecta obstáculos
            obstacles = None
            if lidar_data is not None:
                obstacles = self.detector.analyze_lidar(lidar_data)
            
            # Navegação autônoma
            if self.autonomous_mode and obstacles:
                direction, speed = self.navigator.decide_movement(obstacles)
                self.robot.move(direction, speed)
            
            # Prepara dados para enviar
            message = {
                'type': 'sensor_data',
                'timestamp': asyncio.get_event_loop().time(),
                'obstacles': obstacles
            }
            
            # Envia frame da câmera (comprimido)
            if color_image is not None:
                _, buffer = cv2.imencode('.jpg', color_image, [cv2.IMWRITE_JPEG_QUALITY, 50])
                image_base64 = base64.b64encode(buffer).decode('utf-8')
                message['camera'] = image_base64
            
            await self.send_to_all(message)
            await asyncio.sleep(0.1)  # 10 Hz
    
    async def start_server(self, host='localhost', port=8765):
        """Inicia o servidor WebSocket"""
        async with websockets.serve(self.handle_client, host, port):
            print(f"✓ Servidor WebSocket rodando em ws://{host}:{port}")
            # Inicia loop de sensores
            await self.sensor_loop()


def main():
    """Função principal"""
    print("=== Sistema de Controle Autônomo ===\n")
    
    # Inicializa componentes
    print("Inicializando sensores...")
    sensors = RealSenseController()
    sensors.start()
    
    detector = ObstacleDetector(safe_distance=0.8)
    navigator = AutonomousNavigator(detector)
    robot = RobotController()
    
    # Inicia servidor WebSocket
    server = WebSocketServer(robot, sensors, detector, navigator)
    
    try:
        asyncio.run(server.start_server())
    except KeyboardInterrupt:
        print("\n\nEncerrando sistema...")
        sensors.stop()
        if robot.serial_port:
            robot.move('stop', 0)
        print("✓ Sistema encerrado")


if __name__ == "__main__":
    main()
