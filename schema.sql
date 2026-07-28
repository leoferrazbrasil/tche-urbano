-- ==========================================================================
-- Tchê Urbano & Santa Temporada - Supabase PostgreSQL Database Schema
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/ycpzyuzkainfglljfmbn/sql/new
-- ==========================================================================

-- 1. Tabela de Parceiros Comerciais (B2B Lojistas)
CREATE TABLE IF NOT EXISTS parceiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_estabelecimento VARCHAR(255) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    bairro_endereco TEXT NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Ofertas Ativas
CREATE TABLE IF NOT EXISTS ofertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parceiro_id UUID REFERENCES parceiros(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco_original DECIMAL(10,2) NOT NULL,
    preco_promocional DECIMAL(10,2) NOT NULL,
    desconto_percent INT NOT NULL,
    imagem_url TEXT NOT NULL,
    destaque_vip BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'ativa', -- 'ativa' ou 'pausada'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Resgates & Validações de Cupons
CREATE TABLE IF NOT EXISTS cupons_resgatados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oferta_id UUID REFERENCES ofertas(id) ON DELETE CASCADE,
    codigo_voucher VARCHAR(50) UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'gerado', -- 'gerado', 'validado'
    data_resgate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_validacao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar leitura/escrita anonima publica para o protótipo inicial (Row Level Security)
ALTER TABLE parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons_resgatados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Publico Parceiros" ON parceiros FOR ALL USING (true);
CREATE POLICY "Acesso Publico Ofertas" ON ofertas FOR ALL USING (true);
CREATE POLICY "Acesso Publico Cupons" ON cupons_resgatados FOR ALL USING (true);
