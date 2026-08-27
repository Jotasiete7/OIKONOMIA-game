"""
companion/screen_capture.py
============================
Captura passiva da janela do Capitalism Lab via MSS + Win32 API.

⚠️  READ-ONLY SAFETY: Este módulo apenas LÊ pixels da tela.
     Screenshots são salvas SOMENTE em companion/cache/ (nunca no jogo).
     Nenhum input é enviado ao jogo (nenhum click, tecla, etc.).
"""

import os
import time
import ctypes
import logging
from pathlib import Path
from typing import Optional, Tuple, NamedTuple
from datetime import datetime

try:
    import mss
    import mss.tools
    MSS_AVAILABLE = True
except ImportError:
    MSS_AVAILABLE = False
    logging.warning("[screen_capture] 'mss' não instalado. pip install mss")

try:
    import win32gui
    import win32con
    import win32process
    WIN32_AVAILABLE = True
except ImportError:
    WIN32_AVAILABLE = False
    logging.warning("[screen_capture] 'pywin32' não instalado. pip install pywin32")

try:
    from PIL import Image, ImageGrab
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    logging.warning("[screen_capture] 'Pillow' não instalado. pip install Pillow")

from .config import CACHE_DIR, GAME_WINDOW_TITLE, GAME_PROCESS_NAME

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Estrutura de geometria de janela
# ---------------------------------------------------------------------------

class WindowGeometry(NamedTuple):
    hwnd:   int    # handle da janela Win32
    left:   int    # coordenada X da borda esquerda (tela absoluta)
    top:    int    # coordenada Y da borda superior (tela absoluta)
    width:  int
    height: int

    @property
    def right(self) -> int:
        return self.left + self.width

    @property
    def bottom(self) -> int:
        return self.top + self.height

    @property
    def mss_monitor(self) -> dict:
        """Retorna dicionário compatível com mss para captura."""
        return {
            "left":   self.left,
            "top":    self.top,
            "width":  self.width,
            "height": self.height,
        }

    def roi_absolute(self, roi: Tuple[int,int,int,int]) -> Tuple[int,int,int,int]:
        """Converte ROI relativa à janela em coordenadas absolutas de tela."""
        rx, ry, rw, rh = roi
        return (
            self.left + rx,
            self.top  + ry,
            rw,
            rh,
        )


# ---------------------------------------------------------------------------
# Detecção da janela do jogo
# ---------------------------------------------------------------------------

def find_game_window() -> Optional[WindowGeometry]:
    """
    Localiza a janela do Capitalism Lab via Win32 API (read-only — apenas consulta).
    Retorna WindowGeometry ou None se o jogo não estiver rodando.
    """
    if not WIN32_AVAILABLE:
        logger.warning("pywin32 não disponível. Usando fallback de tela cheia.")
        return _fullscreen_fallback()

    hwnd = win32gui.FindWindow(None, GAME_WINDOW_TITLE)
    if not hwnd:
        # Tenta busca parcial pelo título
        def _enum_cb(h, result):
            title = win32gui.GetWindowText(h)
            if GAME_WINDOW_TITLE.lower() in title.lower():
                result.append(h)
        handles = []
        win32gui.EnumWindows(_enum_cb, handles)
        hwnd = handles[0] if handles else 0

    if not hwnd:
        logger.warning(f"Janela '{GAME_WINDOW_TITLE}' não encontrada. Jogo rodando?")
        return None

    # Obtém área do cliente (sem bordas e barra de título)
    try:
        rect = win32gui.GetClientRect(hwnd)
        # Converte para coordenadas de tela
        pt_left_top = win32gui.ClientToScreen(hwnd, (rect[0], rect[1]))
        pt_right_bot = win32gui.ClientToScreen(hwnd, (rect[2], rect[3]))
        left   = pt_left_top[0]
        top    = pt_left_top[1]
        width  = pt_right_bot[0] - left
        height = pt_right_bot[1] - top
    except Exception:
        # Fallback: GetWindowRect inclui bordas
        rect = win32gui.GetWindowRect(hwnd)
        left, top, right, bottom = rect
        width  = right - left
        height = bottom - top

    if width <= 0 or height <= 0:
        logger.warning("Janela do jogo com dimensões inválidas.")
        return None

    logger.info(f"Janela encontrada: hwnd={hwnd} @ ({left},{top}) {width}x{height}px")
    return WindowGeometry(hwnd=hwnd, left=left, top=top, width=width, height=height)


def _fullscreen_fallback() -> Optional[WindowGeometry]:
    """Fallback: usa resolução primária do monitor quando Win32 não disponível."""
    try:
        user32 = ctypes.windll.user32
        w = user32.GetSystemMetrics(0)
        h = user32.GetSystemMetrics(1)
        return WindowGeometry(hwnd=0, left=0, top=0, width=w, height=h)
    except Exception:
        return None


def bring_game_to_foreground(hwnd: int) -> None:
    """
    Traz a janela do jogo para o primeiro plano APENAS para facilitar OCR.
    Não envia inputs ao jogo — apenas foco de janela.
    """
    if not WIN32_AVAILABLE or not hwnd:
        return
    try:
        if win32gui.IsIconic(hwnd):  # se minimizado, restaura
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
        win32gui.SetForegroundWindow(hwnd)
        time.sleep(0.1)  # aguarda render
    except Exception as exc:
        logger.debug(f"Não foi possível trazer janela ao primeiro plano: {exc}")


# ---------------------------------------------------------------------------
# Captura de tela (READ-ONLY — apenas leitura de pixels)
# ---------------------------------------------------------------------------

class ScreenCapture:
    """
    Captura passiva da tela do Capitalism Lab.
    Salva screenshots no cache do companion (NUNCA no diretório do jogo).
    """

    def __init__(self) -> None:
        self._sct: Optional["mss.mss"] = None
        self._last_geometry: Optional[WindowGeometry] = None

    def _get_sct(self):
        """Lazy init do contexto mss."""
        if self._sct is None and MSS_AVAILABLE:
            self._sct = mss.mss()
        return self._sct

    def capture_game_window(self, save_to_cache: bool = True) -> Optional[Path]:
        """
        Captura a janela inteira do jogo.
        Retorna caminho do arquivo salvo em CACHE_DIR, ou None se falhar.
        """
        geom = find_game_window()
        if geom is None:
            return None
        self._last_geometry = geom

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_path = CACHE_DIR / f"capture_{timestamp}_full.png"

        if MSS_AVAILABLE:
            return self._capture_mss(geom.mss_monitor, out_path)
        elif PIL_AVAILABLE:
            return self._capture_pil(geom, out_path)
        else:
            logger.error("Nenhum backend de captura disponível (mss ou Pillow).")
            return None

    def capture_roi(
        self,
        roi: Tuple[int, int, int, int],
        label: str = "roi",
        save_to_cache: bool = True,
    ) -> Optional[Path]:
        """
        Captura uma ROI específica da janela do jogo.
        roi = (x_relativo, y_relativo, width, height) em relação à janela.
        """
        geom = self._last_geometry or find_game_window()
        if geom is None:
            return None
        self._last_geometry = geom

        abs_roi = geom.roi_absolute(roi)
        monitor = {
            "left":   abs_roi[0],
            "top":    abs_roi[1],
            "width":  abs_roi[2],
            "height": abs_roi[3],
        }
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        out_path  = CACHE_DIR / f"capture_{timestamp}_{label}.png"

        if MSS_AVAILABLE:
            return self._capture_mss(monitor, out_path)
        elif PIL_AVAILABLE:
            return self._capture_pil_roi(abs_roi, out_path)
        else:
            return None

    def _capture_mss(self, monitor: dict, out_path: Path) -> Optional[Path]:
        """Captura usando mss (mais rápido, sem dependência de display server)."""
        try:
            sct = self._get_sct()
            screenshot = sct.grab(monitor)
            mss.tools.to_png(screenshot.rgb, screenshot.size, output=str(out_path))
            logger.info(f"Screenshot salvo: {out_path.name}")
            return out_path
        except Exception as exc:
            logger.error(f"Erro MSS ao capturar: {exc}")
            return None

    def _capture_pil(self, geom: WindowGeometry, out_path: Path) -> Optional[Path]:
        """Fallback: captura via Pillow ImageGrab."""
        try:
            img = ImageGrab.grab(
                bbox=(geom.left, geom.top, geom.right, geom.bottom),
                all_screens=True
            )
            img.save(str(out_path), "PNG")
            logger.info(f"Screenshot (PIL) salvo: {out_path.name}")
            return out_path
        except Exception as exc:
            logger.error(f"Erro PIL ao capturar: {exc}")
            return None

    def _capture_pil_roi(self, abs_roi: Tuple, out_path: Path) -> Optional[Path]:
        """Captura ROI via Pillow."""
        x, y, w, h = abs_roi
        try:
            img = ImageGrab.grab(bbox=(x, y, x+w, y+h), all_screens=True)
            img.save(str(out_path), "PNG")
            return out_path
        except Exception as exc:
            logger.error(f"Erro PIL ROI: {exc}")
            return None

    def get_last_geometry(self) -> Optional[WindowGeometry]:
        return self._last_geometry

    def __del__(self) -> None:
        if self._sct:
            try:
                self._sct.close()
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Instância singleton para uso pelos outros módulos
# ---------------------------------------------------------------------------
_capturer = ScreenCapture()

def capture_now(label: str = "snapshot") -> Optional[Path]:
    """Atalho de captura de tela completa para uso rápido."""
    return _capturer.capture_game_window()

def capture_roi_now(roi: Tuple[int,int,int,int], label: str = "roi") -> Optional[Path]:
    """Atalho de captura de ROI."""
    return _capturer.capture_roi(roi, label)

def get_window_geometry() -> Optional[WindowGeometry]:
    """Retorna geometria atual da janela do jogo."""
    return find_game_window()
