<div align="center">

# ⚡ Amortiza — App de Recálculo de Metas & OCR On-Device

  <p align="center">
    <strong>Aplicativo financeiro minimalista para acompanhamento de ganhos e amortização inteligente de metas numéricas.</strong>
  </p>

  <p align="center">
    <a href="https://reactnative.dev/docs/getting-started"><img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native"></a>
    <a href="https://docs.expo.dev/"><img src="https://img.shields.io/badge/Expo_SDK-57-000000?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 57"></a>
    <a href="https://supabase.com/docs"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"></a>
    <a href="https://developers.google.com/ml-kit/vision/text-recognition/v2"><img src="https://img.shields.io/badge/Google_ML_Kit-OCR_OnDevice-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google ML Kit"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  </p>

</div>

---

## 📌 Sobre o Projeto

O **Amortiza** é uma solução mobile desenvolvida para profissionais e autônomos que buscam praticidade no acompanhamento diário de resultados e na **amortização inteligente de metas financeiras**.

Inspirado nos dashboards de ganhos de plataformas de mobilidade (ex.: Uber / Fintechs modernas), o aplicativo permite capturar prints de telas de relatórios, extrair automaticamente os valores numéricos com **OCR 100% On-Device** e recalcular as metas dos dias subsequentes em tempo real.

---

## ✨ Funcionalidades Principais

* 📊 **Dashboard Minimalista Estilo Uber:** Visualização intuitiva do valor total da semana, destaques diários e gráfico de barras interativo de 7 dias (Segunda a Domingo).
* ⚡ **Regra de Negócio Amortiza (Meta Diária Recalculada):** Algoritmo exclusivo que ajusta dinamicamente a meta do dia seguinte com base na performance acumulada.
* 📷 **OCR On-Device (Google ML Kit):** Reconhecimento óptico de caracteres direto no processador do celular, sem dependência de APIs em nuvem pagas ou tráfego de rede.
* 🔒 **Conformidade Estrita com LGPD:** Imagens de prints são processadas exclusivamente na memória RAM temporária e descartadas imediatamente após a leitura dos números.
* 🗄️ **Persistência Segura com Supabase:** Conexão com banco de dados PostgreSQL gerenciado e protegido via *Row Level Security* (RLS).
* 📱 **Navegação & UI Fluida:** Botão flutuante (FAB) de captura rápida e modal *Bottom Sheet* para confirmação ou ajuste manual dos valores lidos.

---

## 🛠️ Tecnologias e Frameworks

* **Front-end Mobile:** [React Native](https://reactnative.dev/docs/getting-started) com [Expo SDK 57](https://docs.expo.dev/)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Motor de OCR Local:** [Google ML Kit Text Recognition v2](https://developers.google.com/ml-kit/vision/text-recognition/v2) (`@react-native-ml-kit/text-recognition`)
* **Backend & Banco de Dados:** [Supabase Client](https://supabase.com/docs/reference/javascript/initializing) (PostgreSQL com RLS)
* **Gerenciamento de Layout:** [React Native Safe Area Context](https://github.com/AppAndFlow/react-native-safe-area-context)
* **Captura de Imagem:** [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)

---

## 📂 Estrutura do Repositório

```text
amortiza/
├── src/
│   ├── services/
│   │   ├── ocr.ts          # Processamento OCR Google ML Kit (Memória RAM & LGPD)
│   │   └── supabase.ts     # Cliente e queries de persistência no PostgreSQL
│   └── types/
│       └── index.ts        # Interfaces e modelos de dados TypeScript
├── App.tsx                 # Interface principal (Dashboard, Gráfico, FAB e Bottom Sheet)
├── app.json                # Configuração do Expo SDK 57 e permissões de câmera/fotos
├── tsconfig.json           # Configuração estrita do compilador TypeScript
├── package.json            # Matriz de dependências do projeto
└── README.md               # Documentação técnica do projeto
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* [Node.js](https://nodejs.org/) (v18 ou superior)
* Aplicativo **Expo Go** instalado no seu celular (Android / iOS)

### Passo a Passo

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/RobertoNeto-Br/Projeto-Amortiza.git
   cd Projeto-Amortiza
   ```

2. **Instalar as Dependências:**
   ```bash
   npm install
   ```

3. **Iniciar o Servidor Expo (Modo Tunnel):**
   ```bash
   npx expo start --tunnel
   ```

4. **Carregar no Celular:**
   * Abra o aplicativo **Expo Go** no celular.
   * Escaneie o QR Code exibido no terminal.

---

## 🗄️ Configuração da Tabela no Supabase (SQL)

Para estruturar o banco de dados PostgreSQL no [Supabase](https://supabase.com/), execute o script SQL abaixo na aba **SQL Editor** do painel do Supabase:

```sql
-- Criação da tabela de metas numéricas
create table if not exists public.metas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  descricao text not null,
  valor_meta numeric(10, 2) not null,
  valor_atingido numeric(10, 2) default 0.00,
  percentual numeric(5, 2) default 0.00
);

-- Ativação do Row Level Security (RLS) para conformidade de segurança
alter table public.metas enable row level security;

-- Política de leitura e inserção para a chave de API pública (anon)
create policy "Permitir leitura e criacao de metas pelo aplicativo"
  on public.metas
  for all
  to anon, authenticated
  using (true)
  with check (true);
```

---

## 🛡️ Segurança e Privacidade (LGPD)

O aplicativo foi arquitetado priorizando a privacidade dos dados financeiros do usuário:
1. **Nenhum arquivo de imagem é enviado para a nuvem.**
2. O OCR é executado nativamente pelo processador do smartphone.
3. O buffer da imagem capturada é destruído da memória RAM em até 3 segundos após a extração dos dígitos numéricos.

---

<div align="center">
  <p>Desenvolvido com 💚 para otimização de metas e inteligência financeira.</p>
</div>
