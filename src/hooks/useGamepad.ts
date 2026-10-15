import { useState, useEffect, useCallback } from 'react';
import type { GamepadStatus } from '../types/game';

export function useGamepad() {
  const [gamepad, setGamepad] = useState<GamepadStatus>({
    connected: false,
    name: '',
    buttons: [],
    axes: [],
  });

  const vibrate = useCallback((durationMs = 200, strongMagnitude = 0.8, weakMagnitude = 0.5) => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (gp && gp.vibrationActuator) {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude,
          strongMagnitude,
        }).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    function handleConnected(e: GamepadEvent) {
      setGamepad({
        connected: true,
        name: e.gamepad.id,
        buttons: e.gamepad.buttons.map(b => b.pressed),
        axes: [...e.gamepad.axes],
      });
      vibrate(150, 0.5, 0.5); // Confirmação tátil de conexão
    }

    function handleDisconnected() {
      setGamepad({
        connected: false,
        name: '',
        buttons: [],
        axes: [],
      });
    }

    window.addEventListener('gamepadconnected', handleConnected);
    window.addEventListener('gamepaddisconnected', handleDisconnected);

    // Polling loop a 60 FPS para captura suave de analógicos
    let animationFrameId: number;
    function pollGamepad() {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const firstActive = Array.from(gamepads).find(gp => gp && gp.connected);

      if (firstActive) {
        setGamepad({
          connected: true,
          name: firstActive.id,
          buttons: firstActive.buttons.map(b => b.pressed),
          axes: [...firstActive.axes],
        });
      }

      animationFrameId = requestAnimationFrame(pollGamepad);
    }

    animationFrameId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('gamepadconnected', handleConnected);
      window.removeEventListener('gamepaddisconnected', handleDisconnected);
      cancelAnimationFrame(animationFrameId);
    };
  }, [vibrate]);

  return { gamepad, vibrate };
}
