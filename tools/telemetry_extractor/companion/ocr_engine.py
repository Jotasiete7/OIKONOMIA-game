"""
companion/ocr_engine.py
========================
Motor de OCR para extrair dados financeiros das telas do Capitalism Lab.

Pipeline:
  1. Imagem bruta (PNG do cache)
  2. Pré-processamento OpenCV (grayscale → denoise → threshold)
  3. Tesseract OCR com config especializada para números
  4. Limpeza e normalização de valores monetários e percentuais

⚠️  READ-ONLY: Este módulo lê imagens do CACHE_DIR. Nunca toca arquivos do jogo.
"""

import re
import logging
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Imports condicionais (graceful degradation)
# ---------------------------------------------------------------------------

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("[ocr] OpenCV não instalado. pip install opencv-python")

try:
    import pytesseract
    from PIL import Image
    TESS_AVAILABLE = True
except ImportError:
    TESS_AVAILABLE = False
    logger.warning("[ocr] pytesseract/Pillow não instalados. pip install pytesseract Pillow")

from .config import TESSERACT_CMD, TESSERACT_CONFIG_NUMBERS, TESSERACT_CONFIG_FULL

# Configura caminho do Tesseract
if TESS_AVAILABLE and TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


# ---------------------------------------------------------------------------
# Pré-processamento de imagem
# ---------------------------------------------------------------------------

class ImagePreprocessor:
    """
    Aplica transformações para maximizar precisão do OCR em UIs de jogos.
    O jogo usa fontes pequenas com fundo escuro/colorido — precisa de binarização.
    """

    @staticmethod
    def to_grayscale(image_path: Path) -> Optional[Any]:
        """Carrega imagem e converte para grayscale."""
        if not CV2_AVAILABLE:
            return None
        img = cv2.imread(str(image_path))
        if img is None:
            logger.error(f"Não foi possível carregar imagem: {image_path}")
            return None
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    @staticmethod
    def enhance_for_ocr(gray: Any, scale: float = 2.5) -> Any:
        """
        Pipeline completo de pré-processamento para OCR de UIs de jogo:
        1. Upscale (Tesseract funciona melhor com texto maior)
        2. Denoising
        3. CLAHE (equalização adaptativa de histograma)
        4. Threshold adaptativo + inversão se fundo escuro
        """
        if not CV2_AVAILABLE:
            return gray

        # 1. Upscale bilinear
        h, w = gray.shape[:2]
        gray = cv2.resize(gray, (int(w * scale), int(h * scale)),
                          interpolation=cv2.INTER_CUBIC)

        # 2. Denoising suave
        gray = cv2.fastNlMeansDenoising(gray, h=10)

        # 3. CLAHE — melhora contraste localmente
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        gray  = clahe.apply(gray)

        # 4. Detecta se é fundo escuro (jogo usa UI dark)
        mean_val = float(np.mean(gray))
        if mean_val < 128:
            # Fundo escuro → inverte antes do threshold
            gray = cv2.bitwise_not(gray)

        # 5. Threshold adaptativo
        binary = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            blockSize=15,
            C=4,
        )

        # 6. Morfologia: fecha gaps pequenos
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

        return binary

    @staticmethod
    def preprocess(image_path: Path, scale: float = 2.5) -> Optional[Any]:
        """Pipeline completo: carrega, converte, melhora."""
        gray = ImagePreprocessor.to_grayscale(image_path)
        if gray is None:
            return None
        return ImagePreprocessor.enhance_for_ocr(gray, scale)


# ---------------------------------------------------------------------------
# Motor OCR
# ---------------------------------------------------------------------------

class OCREngine:
    """
    Wrapper sobre Tesseract com extração especializada para Capitalism Lab.
    """

    def __init__(self) -> None:
        self.available = TESS_AVAILABLE and CV2_AVAILABLE
        if not self.available:
            logger.warning("[OCREngine] Dependências incompletas — OCR desabilitado.")

    # -----------------------------------------------------------------------
    # Extração de texto bruto
    # -----------------------------------------------------------------------

    def extract_text(
        self,
        image_path: Path,
        config: str = TESSERACT_CONFIG_FULL,
        scale: float = 2.5,
    ) -> str:
        """Extrai texto bruto de uma imagem."""
        if not self.available:
            return ""
        processed = ImagePreprocessor.preprocess(image_path, scale)
        if processed is None:
            # Fallback: tenta com imagem original via Pillow
            return self._fallback_ocr(image_path, config)

        try:
            pil_img = Image.fromarray(processed)
            text = pytesseract.image_to_string(pil_img, config=config)
            return text.strip()
        except Exception as exc:
            logger.error(f"Erro Tesseract: {exc}")
            return self._fallback_ocr(image_path, config)

    def _fallback_ocr(self, image_path: Path, config: str) -> str:
        """Fallback: OCR direto sem pré-processamento OpenCV."""
        try:
            img = Image.open(str(image_path))
            return pytesseract.image_to_string(img, config=config).strip()
        except Exception as exc:
            logger.error(f"Erro OCR fallback: {exc}")
            return ""

    def extract_data_dict(
        self,
        image_path: Path,
        config: str = TESSERACT_CONFIG_NUMBERS,
    ) -> Dict[str, str]:
        """Extrai texto e retorna como dicionário de linhas."""
        text = self.extract_text(image_path, config)
        result = {}
        for line in text.splitlines():
            line = line.strip()
            if ":" in line:
                key, _, val = line.partition(":")
                result[key.strip().lower()] = val.strip()
            elif line:
                result[f"line_{len(result)}"] = line
        return result

    # -----------------------------------------------------------------------
    # Parsers de valores
    # -----------------------------------------------------------------------

    @staticmethod
    def parse_currency(text: str) -> Optional[float]:
        """
        Extrai valor monetário de uma string OCR.
        Suporta formatos: $1,234,567  $1.23M  $456K  (1,234)  -$500
        """
        if not text:
            return None
        text = text.strip().replace(" ", "")

        # Detecta negativos (parênteses ou sinal)
        negative = text.startswith("-") or (text.startswith("(") and text.endswith(")"))
        text = text.lstrip("-(").rstrip(")")

        # Remove símbolo de moeda
        text = text.lstrip("$").strip()

        # Sufixos de magnitude
        multiplier = 1.0
        if text.upper().endswith("B"):
            multiplier = 1_000_000_000
            text = text[:-1]
        elif text.upper().endswith("M"):
            multiplier = 1_000_000
            text = text[:-1]
        elif text.upper().endswith("K"):
            multiplier = 1_000
            text = text[:-1]

        # Remove separadores de milhar e converte ponto decimal
        # Tesseract pode confundir , e . dependendo do locale
        text = text.replace(",", "")
        # Remove caracteres inválidos restantes
        text = re.sub(r"[^\d.]", "", text)

        if not text:
            return None
        try:
            value = float(text) * multiplier
            return -value if negative else value
        except ValueError:
            return None

    @staticmethod
    def parse_percentage(text: str) -> Optional[float]:
        """
        Extrai valor percentual de uma string OCR.
        Suporta: 45.3%  45,3%  45.3  45%
        """
        if not text:
            return None
        # Procura padrão de número seguido de % opcional
        match = re.search(r"(\d{1,3})[,.]?(\d{0,2})\s*%?", text.strip())
        if not match:
            return None
        try:
            integer_part = match.group(1)
            decimal_part = match.group(2) or "0"
            value = float(f"{integer_part}.{decimal_part}")
            # Sanidade: percentual deve ser 0–100
            if 0 <= value <= 100:
                return value
            return None
        except ValueError:
            return None

    @staticmethod
    def find_all_currencies(text: str) -> List[float]:
        """Extrai TODOS os valores monetários de um bloco de texto."""
        # Pattern: opcional negativo, $ opcional, dígitos com separadores, sufixo opcional
        pattern = r"-?\$?[\d,]+\.?\d*\s*[BbMmKk]?"
        matches = re.findall(pattern, text)
        results = []
        for m in matches:
            val = OCREngine.parse_currency(m)
            if val is not None:
                results.append(val)
        return results

    @staticmethod
    def find_all_percentages(text: str) -> List[float]:
        """Extrai TODOS os percentuais de um bloco de texto."""
        pattern = r"\b(\d{1,3}[.,]\d{0,2})\s*%|\b(\d{1,3})\s*%"
        results = []
        for m in re.finditer(pattern, text):
            raw = m.group(1) or m.group(2)
            val = OCREngine.parse_percentage(raw)
            if val is not None:
                results.append(val)
        return results

    # -----------------------------------------------------------------------
    # Detecção de tela
    # -----------------------------------------------------------------------

    def detect_screen_type(self, image_path: Path) -> str:
        """
        Detecta qual tela do jogo está visível via OCR do título/conteúdo.
        Retorna uma das strings: 'income', 'goals', 'factory', 'stock', 'unknown'
        """
        text = self.extract_text(image_path, config=TESSERACT_CONFIG_FULL, scale=1.5)
        text_lower = text.lower()

        if any(kw in text_lower for kw in ["income statement", "operating revenue", "net profit"]):
            return "income"
        if any(kw in text_lower for kw in ["market share", "subgoal", "goal", "target"]):
            return "goals"
        if any(kw in text_lower for kw in ["factory", "manufacture", "mft", "purchase", "retail"]):
            return "factory"
        if any(kw in text_lower for kw in ["stock", "exchange", "p/e", "share price", "dividend"]):
            return "stock"
        return "unknown"


# ---------------------------------------------------------------------------
# Instância singleton
# ---------------------------------------------------------------------------
_engine = OCREngine()


def extract_text(image_path: Path, config: str = TESSERACT_CONFIG_FULL) -> str:
    """Atalho global para extração de texto."""
    return _engine.extract_text(image_path, config)


def parse_currency(text: str) -> Optional[float]:
    """Atalho global para parse de moeda."""
    return OCREngine.parse_currency(text)


def parse_percentage(text: str) -> Optional[float]:
    """Atalho global para parse de percentual."""
    return OCREngine.parse_percentage(text)
