# Arquitetura do Projeto

Documento técnico que descreve a arquitetura, princípios de design, padrões de código e diretrizes de manutenção do projeto **God of War II Web**.

---

## 📁 Estrutura do Projeto

A organização de diretórios e arquivos foi planejada para isolar responsabilidades e garantir uma SPA 100% Client-Side modular:

```text
God-of-War-2-Web/
├── dist/                          # Artefatos compilados para produção (HTML/CSS/JS minificados)
├── node_modules/                  # Dependências de execução e desenvolvimento
├── public/                        # Arquivos estáticos servidos diretamente na raiz
│   └── favicon.svg                # Ícone do projeto
├── src/                           # Código-fonte principal da aplicação
│   ├── components/                # Componentes React de interface e apresentação
│   │   ├── DownloadCard.tsx       # Card de streaming remoto via Internet Archive com progresso
│   │   ├── GameCanvas.tsx         # Container de renderização WebGL 2.0 e atalhos de HUD
│   │   ├── GamepadHUD.tsx         # Indicador de conexão e teste tátil de vibração
│   │   └── LocalFileCard.tsx      # Seletor e carregador de arquivo local via File API
│   ├── hooks/                     # Custom hooks para encapsular lógica de ciclo de vida
│   │   └── useGamepad.ts          # Gerenciamento de polling a 60 FPS e Force Feedback
│   ├── services/                  # Camada de comunicação com APIs externas e armazenamento
│   │   └── romDownloader.ts       # Web Streams API, leitura de chunks e CacheStorage
│   ├── types/                     # Definições estritas de interfaces e tipos TypeScript
│   │   └── game.ts                # Modelos de GameState, GamepadStatus e AudioSettings
│   ├── App.tsx                    # Orquestrador raiz da UI e máquina de estados da sessão
│   ├── index.css                  # Folha de estilos global com Tailwind CSS v4
│   └── main.tsx                   # Ponto de montagem da árvore React 19 no DOM
├── .gitignore                     # Arquivos e pastas excluídos do versionamento Git
├── .oxlintrc.json                 # Regras de linting de alto desempenho com Oxlint
├── index.html                     # Documento HTML principal com meta tags e títulos
├── package.json                   # Manifesto de dependências e scripts de automação
├── package-lock.json              # Trava exata de versões das dependências
├── tsconfig.app.json              # Configurações do compilador TypeScript para o código client
├── tsconfig.json                  # Referência principal de configuração TypeScript
├── tsconfig.node.json             # Configuração TypeScript para ferramentas de build Node.js
├── vite.config.ts                 # Configuração do Vite com plugins React e Tailwind v4
├── README.md                      # Documentação oficial do projeto em Português
├── README_EN.md                   # Documentação oficial do projeto em Inglês
└── ARCHITECTURE.md                # Este documento de arquitetura de software
```

---

## 🎯 Princípios da Arquitetura

### 1. Separação de Responsabilidades (SoC)
* **Apresentação (Components):** Focam exclusivamente em renderizar a UI espartana, capturar cliques do usuário e exibir feedback visual (ex: porcentagem de download).
* **Lógica de Estado & Dispositivos (Hooks):** O `useGamepad.ts` abstrai o loop de `requestAnimationFrame` da Gamepad API, isolando a captura de eventos de hardware dos componentes visuais.
* **Infraestrutura e I/O (Services):** O `romDownloader.ts` lida diretamente com requisições HTTP, streams de leitura de bytes (`ReadableStream`) e chamadas de persistência da `CacheStorage API`.

### 2. Escalabilidade & Zero Custo de Infraestrutura
* **Client-Side First:** A aplicação não necessita de servidores de aplicação dedicados (Node/Python). O processamento de emulação PS2 é descarregado 100% para a CPU/GPU do dispositivo do jogador via WebAssembly e WebGL 2.0.
* **CDN Edge Hosting:** O pacote `dist/` gerado é estático e pode ser distribuído globalmente via Vercel ou Netlify com tempo de resposta na casa dos milissegundos.

### 3. Reusabilidade
* O hook `useGamepad` e o serviço `romDownloader` foram concebidos de forma desacoplada do jogo em si, podendo ser reutilizados em qualquer outro port web de console clássico.

### 4. Manutenibilidade & Resiliência
* **Persistência Descentralizada:** Os dados de save são mantidos no `IndexedDB` e a ROM no `CacheStorage`. Falhas de rede durante partidas subsequentes não interrompem a execução do jogo.

---

## 📝 Convenções

### Nomenclatura de Arquivos e Pastas
- **Componentes React:** PascalCase (ex: `GameCanvas.tsx`, `DownloadCard.tsx`).
- **Hooks:** camelCase com prefixo `use` (ex: `useGamepad.ts`).
- **Serviços e Utilitários:** camelCase (ex: `romDownloader.ts`).
- **Tipos e Interfaces:** camelCase para arquivos (ex: `game.ts`) e PascalCase para tipos/interfaces (ex: `GameState`).
- **Estilos:** kebab-case (ex: `index.css`).

### Convenções de Codificação
- **TypeScript Strict Mode:** Toda a base de código opera com verificação estrita de tipos (`tsc -b`), proibindo declarações implícitas do tipo `any`.
- **Clean Code & KISS:** Funções enxutas, sem dependências desnecessárias ou abstrações prematuras.
- **Tailwind CSS v4:** Classes utilitárias padronizadas e sem repetição manual de CSS puro.

---

## 🛠️ Manutenção e Expansão

### Manutenção:
- **Atualização de Dependências:** Execute periodicamente `npm outdated` e `npm update` para verificar melhorias de desempenho no Vite e no Tailwind.
- **Validação de Build:** Antes de cada commit, execute sempre `npm run build` para garantir que a checagem de tipos TypeScript e o bundle estejam 100% íntegros.

### Adicionando Novas Funcionalidades:
1. **Novo Recurso de Emulação ou Menu:**
   - Adicione o componente correspondente dentro de `src/components/`.
   - Caso precise de estados adicionais de configuração de vídeo ou áudio, declare os tipos em `src/types/game.ts`.
2. **Integração de Novos Cores ou Jogos:**
   - Adicione o endpoint correspondente no serviço de download em `src/services/`.
   - Mantenha o tratamento de erros e a emissão de progresso via callback.

---

**Última atualização**: 15 de Outubro de 2026  
**Versão do projeto**: 1.0.0  
**Manutenedor**: Felipe Moreira
