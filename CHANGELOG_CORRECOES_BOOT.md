# 📝 Relatório de Diagnóstico e Correções – God of War II (WebAssembly / WebGPU)

**Data:** 02/11/2026  
**Ambiente:** WebAssembly (Emscripten) + WebGPU / Custom PS2 EE Runtime (`ps2-web-recomp`)  
**URL:** [https://gow.lacrosstech.com.br](https://gow.lacrosstech.com.br)

---

## 🎯 1. O Problema Investigado
O jogo carregava os arquivos e a imagem ISO, inicializava o IOP e o motor WebGPU, mas travava no boot em uma **tela preta perpétua**, sem renderizar nenhum quadro (`prims = 0`).

Ao inspecionar a execução pelo console do navegador:
* A **Thread 1** entrava em um loop infinito no endereço `0x0018D5A0`.
* A **Thread 2** (trabalhadora do SCE SIF, prioridade 0) estava bloqueada em `WaitSema(2)` no endereço `0x002D0480`.
* O semáforo 2 permanecia em `count 0 waiters 1`.
* Os pacotes de resposta da IOP (como `sceSifBindRpc` para registrar os clientes de RPC) eram enviados, o canal DMAC 5 (SIF0) disparava a interrupção, mas a Thread 2 nunca era acordada para processá-los.

---

## 🔬 2. Análise da Causa-Raiz (Smoking Gun)

### A. O Manipulador DMAC SIF0 (`0x002D0600` em `unit_0074.cpp`)
No código descompilado de God of War II:
```cpp
L_002D0600:
    set32(c.r[3], 0u - 47u); // syscall iGetThreadId()
    syscall(c, 0x002D0610u);
    c.r[16].d[0] = c.r[2].d[0] + 0ull; // c.r[16] = iGetThreadId()
    const bool t = c.r[16].d[0] == c.r[4].d[0]; // Compara a0 com o id da thread atual!
    if (t) { goto L_002D0630; } // Caminho de sucesso: sinaliza o Semáforo 2 via iSignalSema(sema_2)
    
    // Se a0 != iGetThreadId():
    unit_0073(c, 270u); // Chama iWakeupThread(a0)
    goto L_002D0688;    // Sai do tratador SEM sinalizar o semáforo 2!
```

### B. Onde Estava o Erro no Kernel EE (`kernel.cpp`)
1. Na função `run_dmac(Cpu &c, unsigned channel)`:
   - A chamada `run_guest` passava como primeiro argumento (`a0`): `channel` (valor `5`)!
   - O argumento registrado no manipulador (`h.arg`, registrado via `AddDmacHandler2` com o ponteiro de contexto ou ID do SIF) era passado em `a1` e ignorado pelo código do jogo.
2. Quando a interrupção DMAC do canal 5 (SIF0) disparava:
   - `iGetThreadId()` retornava `1` (a thread interrompida).
   - O código comparava `1 == 5` (o canal DMAC), o que obviamente avaliava para `false`.
   - O tratador pulava para chamar `iWakeupThread(5)` (thread `5` não existe) e saía sem passar pelo bloco `L_002D0630` que chama `iSignalSema(2)`!
3. Como `iSignalSema(2)` nunca era executado:
   - A **Thread 2** nunca era liberada de `WaitSema(2)`.
   - As respostas de RPC da IOP ficavam presas.
   - A **Thread 1** nunca recebia o cliente RPC pronto e ficava em loop infinito.

---

## 🛠️ 3. Modificações Implementadas

### 1. Correção da Passagem de Argumentos nos Manipuladores DMAC
**Arquivo:** [`ps2-web-recomp/runtime/src/kernel.cpp`](file:///e:/07.%20PROGRAMMING/God-of-War-2-Web/ps2-web-recomp/runtime/src/kernel.cpp)

Conforme a especificação do Emotion Engine kernel (`AddDmacHandler` / `AddDmacHandler2`), quando um tratador possui `arg` customizado registrado, `a0` deve receber esse argumento de contexto:

```cpp
void run_dmac(Cpu &c, unsigned channel) {
    hw::dmac_ack(channel);
    std::fprintf(stderr, "[dmac] interrupt ch%u thread %d\n", channel, g_current);
    const std::vector<Handler> handlers = g_dmac_handlers;
    for (const Handler &h : handlers) {
        if (h.cause != channel) continue;
        std::fprintf(stderr, "[dmac] executing handler 0x%08X ch%u arg 0x%08X gp 0x%08X\n", h.address, channel, h.arg, h.gp);
        const std::uint32_t a0 = h.arg ? h.arg : channel;
        const std::int32_t result = static_cast<std::int32_t>(run_guest(c, h.address, a0, h.arg, 0, h.gp));
        if (result < 0) break;
    }
}
```

### 2. Instrumentação e Diagnóstico no Kernel
Adição de logs de diagnóstico para rastreio em tempo real de semáforos e DMAC:
* Rastreamento de `SignalSema` e `WaitSema` com status de acordamento de waiters.
* Dump detalhado dos registradores e filas de threads em caso de deadlock.

---

## 📦 4. Compilação e Deploy Realizados
1. **Compilação WebAssembly:**
   - Executado via Ninja: `ninja -C build/web-gow2 ps2web`
   - Gerados: `libps2runtime.a`, `ps2web.wasm`, `ps2web.js`, `ps2web.html`.
2. **Atualização dos Artefatos Públicos:**
   - Copiados para `public/` (`ps2web.wasm`, `ps2web.js`, `ps2web.html`).
   - Atualizado o parâmetro de cache busting no script do [`public/index.html`](file:///e:/07.%20PROGRAMMING/God-of-War-2-Web/public/index.html) (`v=1730586000`).
3. **Controle de Versão (Git):**
   - Commit no submódulo `ps2-web-recomp`:
     `fix(kernel): pass registered handler argument to DMAC callbacks`
   - Commit no repositório principal:
     `fix(web): update wasm runtime with DMAC handler argument fix`
   - Executado `git push origin main` com sucesso, acionando o pipeline automático na Vercel.

---

## ⚠️ 5. Incidente de Infraestrutura / Hosting (Vercel) – 11/11/2026

### Alerta: Esgotamento de Limite de Tráfego (Hobby Tier)
Em 11/11/2026, as implantações na Vercel foram pausadas automaticamente devido ao estouro de cota de dados:
* **Fast Origin Transfer:** **30.14 GB / 10 GB** (300% do limite gratuito excedido).
* **Fast Data Transfer:** **45.85 GB / 100 GB**.
* **CDN Requests:** **228K / 1M**.
* **Status:** `Deployments Paused - Your team exceeded the Hobby fair use limits. Upgrade to Pro to resume service.`

### Causa Raiz:
* O arquivo `disc.iso` / imagem do God of War 2 possui múltiplos gigabytes (~4 GB a 8 GB) e os binários WASM (`ps2web.wasm` tem ~16 MB).
* Ao realizar múltiplos testes com streaming contínuo de setores da ISO diretamente da origem Vercel via HTTP Range Requests (`ps2web_fetch`), o limite de 10 GB de Origin Transfer do plano gratuito foi consumido rapidamente.

### Ações Recomendadas:
1. **Desacoplar a ISO do host Vercel:** Hospedar o arquivo `.iso` / `.chd` em um bucket com tráfego gratuito/barato de saída (Cloudflare R2, Backblaze B2, ou servidor CDN próprio) e apontar via query param (`?disc=https://...`).
2. **Alternativa Local / Cloudflare Pages:**
   * Testar localmente via servidor HTTP estático com suporte a `Cross-Origin-Opener-Policy: same-origin` e `Cross-Origin-Embedder-Policy: require-corp` (ex.: `npx serve public` ou script Node local).
   * Migrar o front-end estático para **Cloudflare Pages**, que não possui limite restritivo de 10 GB de Origin Transfer no plano gratuito.
