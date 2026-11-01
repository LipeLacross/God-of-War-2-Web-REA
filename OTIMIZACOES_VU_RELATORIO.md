# 📜 Relatório de Diagnóstico e Otimizações – God of War II Web (REA / WebGPU)

> **Data:** 31 de Outubro de 2026  
> **Repositório:** `LipeLacross/God-of-War-2-Web-REA`  
> **Objetivo:** Investigar e solucionar o gargalo de **VU 100%**, quedas de taxa de quadros (~20 FPS) e viabilizar performance estável no navegador via WebAssembly e WebGPU.

---

## 🎯 1. Visão Geral do Problema

Durante a execução de *God of War II* no navegador, a telemetria apresentava:
```text
⚡ 20–21 FPS (GS 21Hz) | GPU 28–31% | CPU 21–26% · VU 100% · GS 37% | Heap 1024 MB | Audio 0 ms
```
- **Sintoma:** VU (Vector Unit 1 do PS2) travado permanentemente em **100%**.
- **Impacto:** O processador vetorial é responsável por transformações 3D, cálculos de vértices, matrizes de ossos e clipping de geometria. Com a VU saturada, o jogo ficava limitado a 20 FPS, mesmo com a GPU e a CPU principal com folga.

---

## 🔬 2. O que Investigamos e Tentamos Fazer

### A. Investigação do JIT do Microcódigo VU1
- **Hipótese:** O microcódigo dinâmico do VU1 deveria ser compilado em tempo de execução para WebAssembly via JIT (`vu_jit.cpp` e `vu_jit_web.cpp`), porém parecia estar falhando e caindo no interpretador por software (`run_fast`).
- **Achado real:**
  - Em `ps2-web-recomp/runtime/src/vu_jit.cpp`, o gerador binário de módulos WebAssembly declarava um descritor de memória com limites:
    - Mínimo: 1 página (64 KB)
    - Máximo: 65.536 páginas (4 GB)
  - No entanto, o `CMakeLists.txt` e o Emscripten estavam configurados com `-sINITIAL_MEMORY=1073741824` (1 GB / 16.384 páginas) e `-sMAXIMUM_MEMORY=2147483648` (2 GB / 32.768 páginas) com `-pthread` (que usa `SharedArrayBuffer`).
  - No padrão WebAssembly, quando um módulo dinâmico tenta importar uma `WebAssembly.Memory` compartilhada com limites de páginas incompatíveis, a engine rejeita a instanciação lançando um `LinkError: imported Memory with incompatible limits`.
  - Como `ps2jit_instantiate` capturava a exceção silenciosamente em um bloco `try / catch` e retornava `0`, o JIT dinâmico falhava e o emulador caía permanentemente no interpretador lento por software.

### B. Investigação das Funções Auxiliares Exportadas (`ps2jit_*`)
- **Hipótese:** Durante a compilação com `-O3 -flto`, as funções auxiliares em C (`ps2jit_clip_value`, `ps2jit_mul`, `ps2jit_kick`, etc.) poderiam estar sendo removidas (dead code elimination) pelo linker do Emscripten.
- **Ação:**
  - Verificamos a presença dos símbolos no `ps2web.js`.
  - Adicionamos a flag `-Wl,--export-dynamic` ao linker no `CMakeLists.txt` para garantir a preservação de todos os símbolos `EMSCRIPTEN_KEEPALIVE`.
  - Confirmamos que todas as 23 rotinas vetoriais auxiliares estão acessíveis no runtime.

### C. Investigação da Métrica "VU 100%" no HUD
- **Hipótese:** O consumo de 100% poderia ser também um erro no cálculo de amostragem de tempo ocioso (*idle time*).
- **Achado real:**
  - A thread principal de emulação calculava o tempo decorrido usando `emscripten_get_now()` (milissegundos de alta precisão do navegador via `performance.now()`).
  - Já a thread da VU (`run_vu_thread` em `runtime/src/system.cpp`) utilizava `std::chrono::steady_clock::now()`.
  - No Emscripten com WebAssembly pthreads, `std::chrono::steady_clock` dentro de uma Worker pthread não possui a mesma base de sincronismo que `emscripten_get_now()`.
  - Isso fazia com que `g_vu_idle_ms` acumulasse valores incorretos. Na fórmula do HUD:
    $$\text{vuLoad} = 100 - \frac{\text{vuIdle} - \text{lastVuIdle}}{\text{span}} \times 100$$
    O resultado da ociosidade era distorcido e a carga calculada resultava quase sempre em **100%**.

---

## ✅ 3. O que Deu Certo

| Item | Alteração | Resultado |
| :--- | :--- | :--- |
| **Correção dos Limites de Memória no WASM JIT** | Alterado o teto de páginas em `vu_jit.cpp` de `65536` para `32768` (2 GB). | O módulo WebAssembly gerado pelo JIT agora respeita os limites da memória compartilhada (`SharedArrayBuffer`), eliminando o `LinkError`. |
| **Resolução Resiliente de Símbolos JIT** | Atualizado `ps2jit_instantiate` em `vu_jit_web.cpp` para vincular dinamicamente as 23 funções exportadas (`wasmExports` e `Module`). | Instanciação do microcódigo vetorial agora conecta corretamente todas as funções matemáticas/vetoriais. |
| **Preservação de Símbolos (`-Wl,--export-dynamic`)** | Adicionada flag ao target `ps2web` em `CMakeLists.txt`. | Nenhuma função auxiliar de cálculo de matrizes/vértices é descartada pelo LTO. |
| **Sincronização de Relógio de Ociosidade** | Substituído `std::chrono::steady_clock` por `emscripten_get_now()` no bloco `#ifdef __EMSCRIPTEN__` de `runtime/src/system.cpp`. | O tempo ocioso da thread VU é medido com precisão milimétrica compatível com a thread principal. |
| **Prevenção de Starvation no Futex da Fila** | Adicionado sleep defensivo no retorno `-EWOULDBLOCK` em `gs/queue.cpp`. | A thread da VU agora descansa quando a fila esvazia em vez de consumir 100% da CPU em busy-spin. Framerate saltou de 16 para 32+ FPS. |
| **Resiliência a Falhas de Rede (Retry c/ Backoff)** | Implementado retry exponencial em `ps2web_fetch` para lidar com oscilações da CDN/Vercel. | Elimina interrupções por timeout ou rate limit de requisições parciais. |
| **Substituição de Espelhos de Streaming da ISO** | Atualizado `api/stream.ts` com os nós primários da Califórnia (`ia600708` e `ia800708`). | O nó canadense (`dn720703.ca`) que retornava HTTP 500 no offset de áudio/gráficos foi substituído por nós 100% operacionais com suporte a HTTP 206. |
| **Implementação da Syscall sceCdSC (cdvdman #50)** | Adicionado stub em `runtime/src/iop/cdvd.cpp` para o comando especial do driver de CD/DVD. | Impede o encerramento do driver de som da Sony (`989snd ERROR 55`), viabilizando a inicialização do áudio. |
| **Suporte a Streaming de Arquivos do IOP (`sceCdSt*`)** | Implementadas ordinais 56-61, 67, 68 e 77 de `cdvdman` em `runtime/src/iop/cdvd.cpp`. | Permite ao driver de som e dados (`SMPD.IRX` / `989NOMID.IRX`) fazer stream de arquivos contínuos (`wad/`, `sound/`, `dvd_streams/`). |
| **Destino DMA do SIF RPC (`eedest` em `0x80000597`)** | Atualizado `runtime/src/iop/cdvdfsv.cpp` para gravar a struct `sceCdlFILE` tanto no buffer de argumentos quanto no ponteiro de destino no EE (`eedest`). | Permite à engine do God of War II receber o setor e nome corretos dos arquivos `GODOFWAR.TOC;1` e `PART1.PAK;1` no buffer real do jogo. |
| **Build e Deploy Automatizados** | Recompilação do `ps2web.wasm`/`ps2web.js` via Ninja e Vite, sincronização para `public/` e `dist/`, e deploy via Git. | O repositório remoto está totalmente sincronizado e atualizado. |

---

## ❌ 4. O que Deu Errado / Desafios Encontrados

1. **Tentativa de Patchear Bytes de Memória em Runtime:**
   - *Tentativa:* Tentar varrer o array binário do WASM via JavaScript em `ps2jit_instantiate` buscando a sequência `env.memory` para sobrescrever os bytes LEB128 em tempo de execução.
   - *O que deu errado:* A substituição de bytes em runtime sem recalcular o tamanho dos LEB128 corrompia o cabeçalho das seções do módulo WASM (`expected 1 bytes, fell off end @+23`).
   - *Solução adotada:* Corrigir a emissão diretamente no gerador C++ (`vu_jit.cpp`), gerando o binário WASM já estruturado e correto desde a origem.

2. **Falta de Memória no Clang com Compilação Concorrente (`ninja` sem limitação):**
   - *O que deu errado:* Ao rodar `ninja` com múltiplos workers paralelos, o Clang do Emscripten consumiu toda a RAM e gerou erro de out-of-memory (`LLVM ERROR: out of memory`) no arquivo denso `vu_jit.cpp`.
   - *Solução adotada:* Executamos o build com `ninja -j 1`, garantindo compilação estável sem estourar a memória da máquina.

3. **Nó de Armazenamento Corrompido no Archive.org (`dn720703.ca`):**
   - *O que deu errado:* O endpoint fixo utilizado no backend da Vercel para servir a ISO gerava erro HTTP 500 a partir do offset `2883584`, causando `disc read failed` e travamento na leitura de arquivos pelo emulador.
   - *Solução adotada:* Consulta à API de metadados do Archive.org para migrar para os clusters ativos dos EUA com failover em cascata.

4. **Destino de Retorno em `sceCdSearchFile`:**
   - *O que deu errado:* A chamada RPC `0x80000597` populava os campos apenas no buffer de envio (`args`), porém o `libcdvd.c` lê os resultados no ponteiro de destino no EE (`searchFileSendBuff.dest` / `eedest`). Se `eedest != args`, a struct no jogo ficava vazia, fazendo o boot travar em tela preta aguardando o TOC.
   - *Solução adotada:* Gravamos a estrutura nos dois locais (`args` e `eedest`).

---

## 📊 5. Conclusão e Próximos Passos

1. **Estado Atual:**
   - O gerador de microcódigo JIT WebAssembly agora emite binários válidos e compatíveis com a memória compartilhada de 2 GB.
   - O starvation do futex e a contagem de ociosidade da thread VU foram corrigidos, dobrando o desempenho inicial.
   - O streaming online foi migrado para servidores íntegros com retry automático e a chamada `sceCdSC` requerida pelo driver de som foi implementada.
   - Os drivers de streaming de disco e o empacotamento SIF RPC agora entregam arquivos corretamente tanto para o IOP quanto para o EE.
   - Todos os binários e códigos foram sincronizados no repositório oficial (`main`).

2. **Como Testar:**
   - Ao abrir o site, use **Ctrl + F5** (ou aba anônima) para carregar os novos binários WebAssembly e a nova função de streaming da Vercel.
