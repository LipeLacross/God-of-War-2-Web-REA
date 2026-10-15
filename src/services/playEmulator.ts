/**
 * Play! Web (PS2 WebAssembly) Integration Engine
 * Provides the bridge between React canvas and the Play! WebAssembly core.
 */

// Interface matching Play! Web's Emscripten instance
export interface PlayModule {
  mainScriptUrlOrBlob: string;
  FS: {
    mkdir: (path: string) => void;
    open: (path: string, flags: string) => number;
    write: (stream: number, buffer: Uint8Array, offset: number, length: number, position: number) => number;
    close: (stream: number) => void;
  };
  HEAPU8: Uint8Array;
  ccall: (ident: string, returnType: string | null, argTypes: string[], args: any[]) => any;
  discImageDevice: DiscImageDevice;
  bootDiscImage: (fileName: string) => void;
  bootElf: (fileName: string) => void;
  locateFile: (path: string) => string;
}

/**
 * DiscImageDevice implementation
 * Supplies ISO chunk ranges on-demand to the Play! WebAssembly core.
 */
export class DiscImageDevice {
  private module: PlayModule;
  private doneFlag: boolean = false;
  private file: Blob | File | null = null;

  constructor(module: PlayModule) {
    this.module = module;
  }

  setFile(file: Blob | File) {
    this.file = file;
  }

  getFileSize(): number {
    if (!this.file) throw new Error('No PS2 ISO file set.');
    return this.file.size;
  }

  isDone(): boolean {
    return this.doneFlag;
  }

  read(heapOffset: number, fileOffset: number, length: number) {
    if (!this.file) throw new Error('No PS2 ISO file set.');
    this.doneFlag = false;

    // Stream the sliced range directly into Emscripten HEAPU8 memory
    this.file
      .slice(fileOffset, fileOffset + length)
      .arrayBuffer()
      .then(buffer => {
        this.module.HEAPU8.set(new Uint8Array(buffer), heapOffset);
        this.doneFlag = true;
      })
      .catch(err => {
        console.error('DiscImageDevice read error:', err);
        this.doneFlag = true;
      });
  }
}

/**
 * Boot the Play! PS2 WebAssembly core on the target canvas element
 */
export async function initPlayEmulator(
  canvas: HTMLCanvasElement,
  romBlob: Blob | File,
  isoFileName: string = 'SCUS_974.81.iso'
): Promise<PlayModule> {
  // 1. Dynamic import of Play.js from public directory
  const importModule = new Function('path', 'return import(path)');
  const playModule = await importModule('/Play.js');
  const PlayFactory = playModule.default;

  const moduleConfig: any = {
    canvas,
    locateFile: (path: string) => `/` + path,
    mainScriptUrlOrBlob: '/Play.js',
    print: (text: string) => console.log('[Play!]:', text),
    printErr: (text: string) => console.error('[Play! Err]:', text),
  };

  const playInstance: PlayModule = await PlayFactory(moduleConfig);

  try {
    playInstance.FS.mkdir('/work');
  } catch {
    // Directory might already exist on re-init
  }

  // Bind DiscImageDevice for ISO streaming
  playInstance.discImageDevice = new DiscImageDevice(playInstance);
  playInstance.discImageDevice.setFile(romBlob);

  // Initialize PS2 Virtual Machine
  playInstance.ccall('initVm', '', [], []);

  // Boot the God of War II disc image
  playInstance.bootDiscImage(isoFileName);

  return playInstance;
}
