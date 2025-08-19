// Controle de Robô com 3 Motores via Serial
// Recebe comandos no formato: m1,m2,m3
// Cada valor pode ser de -255 a 255

// Variáveis para os motores
int m1 = 0;
int m2 = 0;  
int m3 = 0;

void setup() {
  // Inicializa comunicação serial
  Serial.begin(9600);
  
  // Configura todos os pinos como OUTPUT
  pinMode(12, OUTPUT);
  pinMode(13, OUTPUT);
  pinMode(8, OUTPUT);
  pinMode(7, OUTPUT);
  pinMode(4, OUTPUT);
  pinMode(2, OUTPUT);
  pinMode(3, OUTPUT);
  pinMode(5, OUTPUT);
  pinMode(6, OUTPUT);
  pinMode(9, OUTPUT);
  pinMode(10, OUTPUT);
  pinMode(11, OUTPUT);
  
  // Ativa os enables (sempre HIGH)
  digitalWrite(12, HIGH);
  digitalWrite(13, HIGH);
  digitalWrite(8, HIGH);
  digitalWrite(7, HIGH);
  digitalWrite(4, HIGH);
  digitalWrite(2, HIGH);
  
  // Inicializa todos os motores parados
  stopAllMotors();
  
  Serial.println("Sistema iniciado. Aguardando comandos...");
}

void loop() {
  // Verifica se há dados disponíveis na serial
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim(); // Remove espaços em branco
    
    if (command.length() > 0) {
      parseCommand(command);
      controlMotors();
    }
  }
}

void parseCommand(String command) {
  // Parse do comando no formato "m1,m2,m3"
  int firstComma = command.indexOf(',');
  int secondComma = command.indexOf(',', firstComma + 1);
  
  if (firstComma > 0 && secondComma > firstComma) {
    m1 = command.substring(0, firstComma).toInt();
    m2 = command.substring(firstComma + 1, secondComma).toInt();
    m3 = command.substring(secondComma + 1).toInt();
    
    // Limita os valores entre -255 e 255
    m1 = constrain(m1, -255, 255);
    m2 = constrain(m2, -255, 255);
    m3 = constrain(m3, -255, 255);
    
    Serial.print("Comando recebido - M1: ");
    Serial.print(m1);
    Serial.print(", M2: ");
    Serial.print(m2);
    Serial.print(", M3: ");
    Serial.println(m3);
  }
}

void controlMotors() {
  // Controle do Motor 1 (pinos 10 e 11)
  if (m1 < 0) {
    int speed1 = abs(m1);
    analogWrite(10, speed1);
    analogWrite(11, 0);
  } else {
    analogWrite(10, 0);
    analogWrite(11, m1);
  }
  
  // Controle do Motor 2 (pinos 6 e 9)
  if (m2 < 0) {
    int speed2 = abs(m2);
    analogWrite(6, speed2);
    analogWrite(9, 0);
  } else {
    analogWrite(6, 0);
    analogWrite(9, m2);
  }
  
  // Controle do Motor 3 (pinos 3 e 5)
  if (m3 < 0) {
    int speed3 = abs(m3);
    analogWrite(3, speed3);
    analogWrite(5, 0);
  } else {
    analogWrite(3, 0);
    analogWrite(5, m3);
  }
}

void stopAllMotors() {
  // Para todos os motores
  analogWrite(10, 0);
  analogWrite(11, 0);
  analogWrite(6, 0);
  analogWrite(9, 0);
  analogWrite(3, 0);
  analogWrite(5, 0);
}

// Função para testes (opcional)
void testMotors() {
  Serial.println("Testando motores...");
  
  // Teste Motor 1
  Serial.println("Testando M1 frente");
  analogWrite(11, 100);
  delay(1000);
  analogWrite(11, 0);
  
  Serial.println("Testando M1 trás");
  analogWrite(10, 100);
  delay(1000);
  analogWrite(10, 0);
  
  // Teste Motor 2
  Serial.println("Testando M2 frente");
  analogWrite(9, 100);
  delay(1000);
  analogWrite(9, 0);
  
  Serial.println("Testando M2 trás");
  analogWrite(6, 100);
  delay(1000);
  analogWrite(6, 0);
  
  // Teste Motor 3
  Serial.println("Testando M3 frente");
  analogWrite(5, 100);
  delay(1000);
  analogWrite(5, 0);
  
  Serial.println("Testando M3 trás");
  analogWrite(3, 100);
  delay(1000);
  analogWrite(3, 0);
  
  Serial.println("Teste concluído");
}