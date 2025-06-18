#!/bin/bash

# Build verification script for FamaChat
echo "🔍 Verificando dependências do projeto..."

# Check Node.js version
node_version=$(node --version)
echo "Node.js version: $node_version"

# Check npm version
npm_version=$(npm --version)
echo "npm version: $npm_version"

# Verify package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado"
    exit 1
fi

echo "✅ package.json encontrado"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
else
    echo "✅ node_modules já existe"
fi

# Verify critical build dependencies
echo "🔧 Verificando dependências críticas para build..."

critical_deps=(
    "@vitejs/plugin-react"
    "vite"
    "typescript"
    "esbuild"
    "tailwindcss"
    "postcss"
    "autoprefixer"
)

for dep in "${critical_deps[@]}"; do
    if npm list "$dep" >/dev/null 2>&1; then
        echo "✅ $dep instalado"
    else
        echo "❌ $dep faltando - reinstalando..."
        npm install "$dep" --save-dev
    fi
done

# Verify runtime dependencies
echo "🏃 Verificando dependências de runtime..."

runtime_deps=(
    "react"
    "react-dom"
    "express"
    "drizzle-orm"
    "pg"
    "redis"
)

for dep in "${runtime_deps[@]}"; do
    if npm list "$dep" >/dev/null 2>&1; then
        echo "✅ $dep instalado"
    else
        echo "❌ $dep faltando - reinstalando..."
        npm install "$dep" --save
    fi
done

# Test build process
echo "🏗️ Testando processo de build..."

if npm run build; then
    echo "✅ Build bem-sucedido"
    
    # Verify build outputs
    if [ -d "dist" ] && [ -d "client/dist" ]; then
        echo "✅ Arquivos de build gerados corretamente"
        echo "   - Backend build: $(ls -la dist/)"
        echo "   - Frontend build: $(ls -la client/dist/)"
    else
        echo "❌ Arquivos de build não encontrados"
        exit 1
    fi
else
    echo "❌ Build falhou"
    echo "Instalando dependências ausentes..."
    npm install --include=dev --include=optional
    
    echo "Tentando build novamente..."
    if npm run build; then
        echo "✅ Build bem-sucedido após reinstalação"
    else
        echo "❌ Build continua falhando"
        exit 1
    fi
fi

echo "🎉 Verificação completa - projeto pronto para Docker build"