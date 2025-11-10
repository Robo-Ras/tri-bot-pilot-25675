#!/bin/bash

# Script de instalação do Sistema de Navegação Autônoma
# Resolve automaticamente problemas de compatibilidade de dependências

echo "==================================="
echo "Instalação do Sistema de Navegação"
echo "==================================="
echo ""

# Verificar se Python 3 está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instale Python 3.8 ou superior."
    exit 1
fi

echo "✓ Python 3 encontrado: $(python3 --version)"
echo ""

# Desinstalar numpy existente para evitar conflitos
echo "🔧 Removendo versões conflitantes do NumPy..."
pip3 uninstall -y numpy 2>/dev/null || true

# Instalar NumPy compatível primeiro
echo "📦 Instalando NumPy 1.24.3 (compatível)..."
pip3 install numpy==1.24.3

# Instalar demais dependências
echo "📦 Instalando dependências Python..."
pip3 install -r requirements.txt

echo ""
echo "==================================="
echo "✅ Instalação concluída com sucesso!"
echo "==================================="
echo ""
echo "Para executar o sistema:"
echo "  python3 robot_autonomous_control.py"
echo ""
