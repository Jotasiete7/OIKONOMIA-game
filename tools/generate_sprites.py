"""
generate_sprites.py - Gerador de Assets Isométricos PNG para o OIKONOMIA
Gera sprites 2.5D de alta fidelidade para Lojas, Empresas, Casas, Estradas, Agro, Minas, Logística/Mídia e Terrenos.
Usa apenas bibliotecas padrão do Python (zlib, struct, math, os).
"""

import os
import zlib
import struct
import math

class ImageBuffer:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        # Buffer RGBA (4 bytes por pixel)
        self.pixels = bytearray(width * height * 4)

    def set_pixel(self, x, y, r, g, b, a=255):
        if 0 <= x < self.width and 0 <= y < self.height:
            idx = (y * self.width + x) * 4
            src_a = a / 255.0
            if src_a == 1.0 or self.pixels[idx+3] == 0:
                self.pixels[idx] = int(r)
                self.pixels[idx+1] = int(g)
                self.pixels[idx+2] = int(b)
                self.pixels[idx+3] = int(a)
            elif src_a > 0.0:
                # Alpha blending
                dst_r = self.pixels[idx]
                dst_g = self.pixels[idx+1]
                dst_b = self.pixels[idx+2]
                dst_a = self.pixels[idx+3] / 255.0

                out_a = src_a + dst_a * (1.0 - src_a)
                if out_a > 0:
                    out_r = (r * src_a + dst_r * dst_a * (1.0 - src_a)) / out_a
                    out_g = (g * src_a + dst_g * dst_a * (1.0 - src_a)) / out_a
                    out_b = (b * src_a + dst_b * dst_a * (1.0 - src_a)) / out_a
                    self.pixels[idx] = int(min(255, max(0, out_r)))
                    self.pixels[idx+1] = int(min(255, max(0, out_g)))
                    self.pixels[idx+2] = int(min(255, max(0, out_b)))
                    self.pixels[idx+3] = int(min(255, max(0, out_a * 255)))

    def fill_rect(self, x0, y0, w, h, r, g, b, a=255):
        for y in range(max(0, y0), min(self.height, y0 + h)):
            for x in range(max(0, x0), min(self.width, x0 + w)):
                self.set_pixel(x, y, r, g, b, a)

    def draw_line(self, x0, y0, x1, y1, r, g, b, a=255, thickness=1):
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy

        while True:
            for tx in range(-thickness//2, thickness//2 + 1):
                for ty in range(-thickness//2, thickness//2 + 1):
                    self.set_pixel(x0 + tx, y0 + ty, r, g, b, a)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy

    def fill_polygon(self, points, r, g, b, a=255):
        """Preenche polígono arbitrário por scanline."""
        if len(points) < 3:
            return
        min_y = max(0, int(min(p[1] for p in points)))
        max_y = min(self.height - 1, int(max(p[1] for p in points)))

        for y in range(min_y, max_y + 1):
            nodes = []
            j = len(points) - 1
            for i in range(len(points)):
                p1 = points[i]
                p2 = points[j]
                if (p1[1] < y and p2[1] >= y) or (p2[1] < y and p1[1] >= y):
                    x = p1[0] + (y - p1[1]) / (p2[1] - p1[1]) * (p2[0] - p1[0])
                    nodes.append(x)
                j = i
            nodes.sort()
            for k in range(0, len(nodes) - 1, 2):
                x_start = max(0, int(nodes[k]))
                x_end = min(self.width - 1, int(nodes[k+1]))
                for x in range(x_start, x_end + 1):
                    self.set_pixel(x, y, r, g, b, a)

    def draw_iso_diamond(self, cx, cy, w, h, fill_rgb, border_rgb=None, fill_a=255):
        """Desenha um losango isométrico na posição (cx, cy) = centro do diamante."""
        pts = [
            (cx, cy - h/2),       # Top
            (cx + w/2, cy),       # Right
            (cx, cy + h/2),       # Bottom
            (cx - w/2, cy),       # Left
        ]
        self.fill_polygon(pts, fill_rgb[0], fill_rgb[1], fill_rgb[2], fill_a)
        if border_rgb:
            for i in range(4):
                p1 = pts[i]
                p2 = pts[(i+1)%4]
                self.draw_line(int(p1[0]), int(p1[1]), int(p2[0]), int(p2[1]), border_rgb[0], border_rgb[1], border_rgb[2], fill_a)

    def draw_iso_box(self, cx, base_cy, w, h, height_px, top_rgb, left_rgb, right_rgb, border_rgb=(10, 20, 30)):
        """
        Desenha um paralelepípedo isométrico 2.5D.
        cx, base_cy: centro do diamante inferior.
        w, h: largura e altura do diamante base.
        height_px: altura vertical extrudada.
        """
        b_top = (cx, base_cy - h/2)
        b_right = (cx + w/2, base_cy)
        b_bottom = (cx, base_cy + h/2)
        b_left = (cx - w/2, base_cy)

        t_top = (cx, base_cy - h/2 - height_px)
        t_right = (cx + w/2, base_cy - height_px)
        t_bottom = (cx, base_cy + h/2 - height_px)
        t_left = (cx - w/2, base_cy - height_px)

        # Face Esquerda (Noroeste - Iluminação Média)
        self.fill_polygon([b_left, b_bottom, t_bottom, t_left], left_rgb[0], left_rgb[1], left_rgb[2])
        # Face Direita (Sudeste - Sombra)
        self.fill_polygon([b_bottom, b_right, t_right, t_bottom], right_rgb[0], right_rgb[1], right_rgb[2])
        # Face Superior (Telhado / Topo - Luz Direta)
        self.fill_polygon([t_top, t_right, t_bottom, t_left], top_rgb[0], top_rgb[1], top_rgb[2])

        # Bordas estruturais
        if border_rgb:
            br, bg, bb = border_rgb
            self.draw_line(int(t_top[0]), int(t_top[1]), int(t_right[0]), int(t_right[1]), br, bg, bb)
            self.draw_line(int(t_right[0]), int(t_right[1]), int(t_bottom[0]), int(t_bottom[1]), br, bg, bb)
            self.draw_line(int(t_bottom[0]), int(t_bottom[1]), int(t_left[0]), int(t_left[1]), br, bg, bb)
            self.draw_line(int(t_left[0]), int(t_left[1]), int(t_top[0]), int(t_top[1]), br, bg, bb)
            self.draw_line(int(b_left[0]), int(b_left[1]), int(t_left[0]), int(t_left[1]), br, bg, bb)
            self.draw_line(int(b_bottom[0]), int(b_bottom[1]), int(t_bottom[0]), int(t_bottom[1]), br, bg, bb)
            self.draw_line(int(b_right[0]), int(b_right[1]), int(t_right[0]), int(t_right[1]), br, bg, bb)

    def draw_iso_roof_pitched(self, cx, base_cy, w, h, height_px, roof_h, roof_rgb_l, roof_rgb_r, border_rgb=(10, 20, 30)):
        """Telhado inclinado duas águas (estilo casa/celeiro)."""
        t_right = (cx + w/2, base_cy - height_px)
        t_bottom = (cx, base_cy + h/2 - height_px)
        t_left = (cx - w/2, base_cy - height_px)
        t_top = (cx, base_cy - h/2 - height_px)

        ridge_top = (cx, base_cy - h/2 - height_px - roof_h)
        ridge_bot = (cx, base_cy + h/2 - height_px - roof_h)

        self.fill_polygon([t_left, t_bottom, ridge_bot, ridge_top], roof_rgb_l[0], roof_rgb_l[1], roof_rgb_l[2])
        self.fill_polygon([t_bottom, t_right, ridge_top, ridge_bot], roof_rgb_r[0], roof_rgb_r[1], roof_rgb_r[2])

        if border_rgb:
            br, bg, bb = border_rgb
            self.draw_line(int(t_left[0]), int(t_left[1]), int(ridge_bot[0]), int(ridge_bot[1]), br, bg, bb)
            self.draw_line(int(t_bottom[0]), int(t_bottom[1]), int(ridge_bot[0]), int(ridge_bot[1]), br, bg, bb)
            self.draw_line(int(t_right[0]), int(t_right[1]), int(ridge_bot[0]), int(ridge_bot[1]), br, bg, bb)
            self.draw_line(int(ridge_bot[0]), int(ridge_bot[1]), int(ridge_top[0]), int(ridge_top[1]), br, bg, bb)

    def draw_circle(self, cx, cy, radius, r, g, b, a=255):
        for y in range(int(cy - radius), int(cy + radius + 1)):
            for x in range(int(cx - radius), int(cx + radius + 1)):
                if (x - cx)**2 + (y - cy)**2 <= radius**2:
                    self.set_pixel(x, y, r, g, b, a)

    def save_png(self, filepath):
        """Exporta para arquivo PNG padrão válido com compressão zlib."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        raw_data = bytearray()
        for y in range(self.height):
            raw_data.append(0) # Filter byte: 0 (None)
            row_start = y * self.width * 4
            raw_data.extend(self.pixels[row_start : row_start + self.width * 4])

        compressed = zlib.compress(bytes(raw_data), 9)

        def make_chunk(chunk_type, data):
            chunk = chunk_type + data
            crc = zlib.crc32(chunk) & 0xffffffff
            return struct.pack('>I', len(data)) + chunk + struct.pack('>I', crc)

        png_header = b'\x89PNG\r\n\x1a\n'
        ihdr_data = struct.pack('>IIBBBBB', self.width, self.height, 8, 6, 0, 0, 0)
        ihdr = make_chunk(b'IHDR', ihdr_data)
        idat = make_chunk(b'IDAT', compressed)
        iend = make_chunk(b'IEND', b'')

        with open(filepath, 'wb') as f:
            f.write(png_header + ihdr + idat + iend)
        print(f"  -> Gerado: {filepath}")

# ==============================================================================
# GERADORES ESPECÍFICOS POR SUBGRUPO
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. LOJAS (client/assets/lojas/)
# ------------------------------------------------------------------------------
def generate_stores():
    print("\n--- Gerando Sprites de Lojas ---")
    base_dir = "client/assets/lojas"

    # Supermarket
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(32, 48, 48, 24, 22, (16, 185, 129), (5, 150, 105), (4, 120, 87))
    b.fill_polygon([(32, 48), (44, 42), (44, 26), (32, 32)], 186, 230, 253, 220)
    b.fill_polygon([(28, 40), (46, 31), (46, 29), (28, 38)], 239, 68, 68)
    b.draw_line(20, 24, 28, 28, 255, 255, 255, 255, 2)
    b.save_png(f"{base_dir}/supermarket.png")

    # Kombini (Conveniência rápida de bairro)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 56, 28, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(32, 48, 40, 20, 16, (52, 211, 153), (16, 185, 129), (5, 150, 105))
    b.fill_polygon([(32, 48), (42, 43), (42, 35), (32, 40)], 224, 242, 254, 240)
    b.draw_iso_box(20, 46, 8, 4, 10, (239, 68, 68), (220, 38, 38), (185, 28, 28))
    b.draw_line(16, 26, 32, 18, 249, 115, 22, 255, 2)
    b.save_png(f"{base_dir}/kombini.png")

    # Apparel (Boutique de Vestuário & Moda)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 56, 28, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(32, 48, 42, 21, 20, (236, 72, 153), (219, 39, 119), (190, 24, 93))
    b.fill_polygon([(32, 48), (44, 42), (44, 32), (32, 38)], 253, 242, 248, 230)
    b.draw_circle(38, 39, 2, 251, 191, 36)
    b.draw_line(18, 34, 32, 41, 251, 191, 36, 255, 2)
    b.save_png(f"{base_dir}/apparel.png")

    # Electronics (Megastore de Eletrônicos & Tech)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (15, 23, 42), (2, 6, 23))
    b.draw_iso_box(32, 48, 48, 24, 24, (56, 189, 248), (2, 132, 199), (3, 105, 161))
    b.fill_polygon([(32, 48), (46, 41), (46, 30), (32, 37)], 14, 165, 233, 240)
    b.draw_line(34, 38, 44, 33, 255, 255, 255, 255, 2)
    b.draw_line(32, 14, 32, 8, 148, 163, 184, 255, 2)
    b.draw_circle(32, 8, 3, 203, 213, 225)
    b.save_png(f"{base_dir}/electronics.png")

    # Automotive (Concessionária de Veículos)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (51, 65, 85), (30, 41, 59))
    b.draw_iso_box(32, 48, 46, 23, 18, (244, 63, 94), (225, 29, 72), (190, 18, 60))
    b.fill_polygon([(32, 48), (48, 40), (48, 28), (32, 36)], 224, 242, 254, 210)
    b.draw_iso_box(40, 42, 10, 5, 4, (251, 191, 36), (217, 119, 6), (180, 83, 9))
    b.save_png(f"{base_dir}/automotive.png")

    # Pharmacy (Drogaria & Cosméticos)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 56, 28, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(32, 48, 42, 21, 18, (248, 250, 252), (226, 232, 240), (203, 213, 225))
    b.fill_rect(36, 32, 6, 2, 34, 197, 94)
    b.fill_rect(38, 30, 2, 6, 34, 197, 94)
    b.save_png(f"{base_dir}/pharmacy.png")

    # Furniture (Loja de Móveis & Decoração)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 58, 29, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(32, 48, 46, 23, 19, (251, 146, 60), (234, 88, 12), (194, 65, 12))
    b.fill_polygon([(32, 48), (46, 41), (46, 33), (32, 40)], 254, 243, 199, 220)
    b.save_png(f"{base_dir}/furniture.png")

    # Jewelry (Joalheria de Alta Nobreza)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 56, 28, (15, 23, 42), (2, 6, 23))
    b.draw_iso_box(32, 48, 40, 20, 20, (251, 191, 36), (217, 119, 6), (180, 83, 9))
    b.fill_polygon([(32, 48), (44, 42), (44, 30), (32, 36)], 24, 24, 27, 240)
    b.draw_circle(38, 36, 2, 255, 255, 255)
    b.save_png(f"{base_dir}/jewelry.png")

    # Hardware (Home Center & Ferramentas)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (51, 65, 85), (30, 41, 59))
    b.draw_iso_box(32, 48, 48, 24, 18, (245, 158, 11), (217, 119, 6), (180, 83, 9))
    b.draw_iso_box(18, 44, 14, 7, 10, (148, 163, 184), (100, 116, 139), (71, 85, 105))
    b.save_png(f"{base_dir}/hardware.png")

    # Competitor (MegaMart Rival IA)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(32, 48, 48, 24, 24, (244, 63, 94), (225, 29, 72), (190, 18, 60))
    b.fill_polygon([(32, 48), (46, 41), (46, 32), (32, 39)], 136, 19, 55, 240)
    b.draw_line(34, 39, 44, 34, 255, 255, 255, 255, 2)
    b.save_png(f"{base_dir}/competitor.png")

# ------------------------------------------------------------------------------
# 2. EMPRESAS & INDÚSTRIAS (client/assets/empresas/)
# ------------------------------------------------------------------------------
def generate_companies():
    print("\n--- Gerando Sprites de Empresas & Indústrias ---")
    base_dir = "client/assets/empresas"

    # Siderúrgica / Metalurgia (Steel Mill)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (51, 65, 85), (15, 23, 42))
    b.draw_iso_box(32, 48, 46, 23, 24, (100, 116, 139), (71, 85, 105), (51, 65, 85))
    b.draw_iso_box(22, 38, 8, 4, 18, (249, 115, 22), (234, 88, 12), (194, 65, 12))
    b.draw_iso_box(42, 38, 8, 4, 18, (249, 115, 22), (234, 88, 12), (194, 65, 12))
    b.draw_circle(22, 16, 3, 203, 213, 225, 180)
    b.draw_circle(42, 16, 3, 203, 213, 225, 180)
    b.save_png(f"{base_dir}/steel_mill.png")

    # Refinaria Petroquímica (Refinery)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(24, 46, 16, 8, 20, (148, 163, 184), (100, 116, 139), (71, 85, 105))
    b.draw_iso_box(40, 44, 14, 7, 26, (56, 189, 248), (2, 132, 199), (3, 105, 161))
    b.draw_line(40, 14, 40, 10, 239, 68, 68, 255, 2)
    b.draw_circle(40, 9, 2, 251, 191, 36)
    b.save_png(f"{base_dir}/refinery.png")

    # Fábrica de Eletrônicos / Semicondutores
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (15, 23, 42), (2, 6, 23))
    b.draw_iso_box(32, 48, 48, 24, 22, (241, 245, 249), (203, 213, 225), (148, 163, 184))
    b.draw_iso_box(32, 34, 16, 8, 4, (56, 189, 248), (2, 132, 199), (3, 105, 161))
    b.fill_polygon([(32, 48), (46, 41), (46, 34), (32, 41)], 14, 165, 233, 200)
    b.save_png(f"{base_dir}/electronics_factory.png")

    # Montadora de Automóveis (Auto Plant)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (51, 65, 85), (15, 23, 42))
    b.draw_iso_box(32, 48, 50, 25, 20, (234, 88, 12), (194, 65, 12), (154, 52, 18))
    b.fill_polygon([(32, 48), (48, 40), (48, 34), (32, 42)], 30, 41, 59, 255)
    b.draw_circle(20, 36, 3, 251, 191, 36)
    b.save_png(f"{base_dir}/auto_plant.png")

    # Tecelagem & Moda (Textile Mill)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 58, 29, (51, 65, 85), (30, 41, 59))
    b.draw_iso_box(32, 48, 46, 23, 18, (219, 39, 119), (190, 24, 93), (157, 23, 77))
    b.draw_iso_box(20, 36, 6, 3, 14, (148, 163, 184), (100, 116, 139), (71, 85, 105))
    b.save_png(f"{base_dir}/textile_mill.png")

    # Indústria de Alimentos & Moinho (Food Processing)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (51, 65, 85), (30, 41, 59))
    b.draw_iso_box(32, 48, 44, 22, 20, (234, 179, 8), (202, 138, 4), (161, 98, 7))
    b.draw_iso_box(18, 44, 10, 5, 22, (248, 250, 252), (226, 232, 240), (203, 213, 225))
    b.save_png(f"{base_dir}/food_processing.png")

    # Fábrica Geral Padrão (Default Factory)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (51, 65, 85), (15, 23, 42))
    b.draw_iso_box(32, 48, 46, 23, 22, (249, 115, 22), (234, 88, 12), (194, 65, 12))
    b.draw_iso_box(22, 36, 6, 3, 16, (148, 163, 184), (100, 116, 139), (71, 85, 105))
    b.draw_iso_box(38, 34, 6, 3, 16, (148, 163, 184), (100, 116, 139), (71, 85, 105))
    b.save_png(f"{base_dir}/factory_default.png")

# ------------------------------------------------------------------------------
# 3. CASAS & ESTRUTURAS URBANAS (client/assets/casas/)
# ------------------------------------------------------------------------------
def generate_houses():
    print("\n--- Gerando Sprites de Casas & Urbanismo ---")
    base_dir = "client/assets/casas"

    # Casa Residencial / Sobrado Suburbano
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 56, 28, (22, 101, 52), (15, 23, 42))
    b.draw_iso_box(32, 48, 36, 18, 14, (254, 243, 199), (253, 230, 138), (252, 211, 77))
    b.draw_iso_roof_pitched(32, 48, 36, 18, 14, 10, (239, 68, 68), (185, 28, 28))
    b.fill_rect(36, 38, 3, 5, 120, 53, 15)
    b.fill_rect(24, 36, 4, 3, 186, 230, 253)
    b.save_png(f"{base_dir}/house_suburban.png")

    # Prédio Residencial Norte (Apartamentos)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 58, 29, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(32, 48, 40, 20, 30, (99, 102, 241), (79, 70, 229), (67, 56, 202))
    for floor in range(3):
        fy = 40 - floor * 8
        b.draw_line(22, fy, 28, fy + 3, 254, 240, 138, 255, 1)
        b.draw_line(34, fy + 3, 40, fy, 254, 240, 138, 255, 1)
    b.save_png(f"{base_dir}/apartment_building.png")

    # Mansão / Residencial Alto Padrão
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (21, 128, 61), (15, 23, 42))
    b.draw_iso_diamond(46, 46, 12, 6, (56, 189, 248), (2, 132, 199))
    b.draw_iso_box(28, 46, 32, 16, 18, (248, 250, 252), (226, 232, 240), (203, 213, 225))
    b.draw_iso_roof_pitched(28, 46, 32, 16, 18, 8, (148, 163, 184), (100, 116, 139))
    b.save_png(f"{base_dir}/mansion.png")

    # Arranha-céu Comercial Nobre (Downtown)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (15, 23, 42), (2, 6, 23))
    b.draw_iso_box(32, 48, 38, 19, 36, (56, 189, 248), (2, 132, 199), (3, 105, 161))
    for i in range(1, 4):
        b.draw_line(20 + i*3, 30, 20 + i*3, 14, 255, 255, 255, 160)
        b.draw_line(34 + i*3, 30, 34 + i*3, 14, 255, 255, 255, 160)
    b.draw_circle(32, 10, 4, 239, 68, 68)
    b.save_png(f"{base_dir}/commercial_tower.png")

    # Edifício de Escritórios Corporativos
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 58, 29, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(32, 48, 42, 21, 26, (148, 163, 184), (100, 116, 139), (71, 85, 105))
    b.fill_polygon([(32, 48), (44, 42), (44, 24), (32, 30)], 186, 230, 253, 200)
    b.save_png(f"{base_dir}/office_building.png")

# ------------------------------------------------------------------------------
# 4. ESTRADAS & INFRAESTRUTURA (client/assets/estradas/)
# ------------------------------------------------------------------------------
def generate_roads():
    print("\n--- Gerando Sprites de Estradas ---")
    base_dir = "client/assets/estradas"

    # Estrada Reta Eixo X (NE-SW)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 32, 64, 32, (15, 41, 30))
    pts_x = [(12, 22), (52, 42), (44, 46), (4, 26)]
    b.fill_polygon(pts_x, 51, 65, 85)
    b.draw_line(8, 24, 48, 44, 251, 191, 36, 255, 1)
    b.save_png(f"{base_dir}/road_straight_x.png")

    # Estrada Reta Eixo Y (NW-SE)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 32, 64, 32, (15, 41, 30))
    pts_y = [(52, 22), (12, 42), (4, 38), (44, 18)]
    b.fill_polygon(pts_y, 51, 65, 85)
    b.draw_line(48, 20, 8, 40, 251, 191, 36, 255, 1)
    b.save_png(f"{base_dir}/road_straight_y.png")

    # Cruzamento 4 Vias
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 32, 64, 32, (15, 41, 30))
    b.draw_iso_diamond(32, 32, 54, 27, (51, 65, 85), (30, 41, 59))
    b.draw_circle(32, 32, 3, 251, 191, 36)
    b.save_png(f"{base_dir}/road_intersection.png")

    # Curva Suave
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 32, 64, 32, (15, 41, 30))
    pts_c = [(12, 22), (32, 32), (52, 22), (44, 18), (32, 28), (4, 26)]
    b.fill_polygon(pts_c, 51, 65, 85)
    b.draw_line(8, 24, 48, 20, 251, 191, 36, 255, 1)
    b.save_png(f"{base_dir}/road_curve.png")

    # Ponte sobre Água
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 32, 64, 32, (3, 30, 51))
    b.draw_iso_box(20, 36, 8, 4, 8, (148, 163, 184), (100, 116, 139), (71, 85, 105))
    b.draw_iso_box(44, 36, 8, 4, 8, (148, 163, 184), (100, 116, 139), (71, 85, 105))
    b.draw_iso_diamond(32, 26, 52, 26, (71, 85, 105), (30, 41, 59))
    b.draw_line(10, 22, 50, 42, 251, 191, 36, 255, 1)
    b.draw_line(8, 18, 48, 38, 203, 213, 225, 255, 1)
    b.draw_line(16, 26, 56, 46, 203, 213, 225, 255, 1)
    b.save_png(f"{base_dir}/bridge.png")

# ------------------------------------------------------------------------------
# 5. AGROPECUÁRIA (client/assets/agro/)
# ------------------------------------------------------------------------------
def generate_farms():
    print("\n--- Gerando Sprites de Agropecuária ---")
    base_dir = "client/assets/agro"

    # Fazenda de Trigo & Grãos
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (234, 179, 8), (161, 98, 7))
    b.draw_iso_box(32, 44, 28, 14, 16, (239, 68, 68), (220, 38, 38), (185, 28, 28))
    b.draw_iso_roof_pitched(32, 44, 28, 14, 16, 8, (254, 240, 138), (250, 204, 21))
    b.draw_line(32, 18, 32, 10, 148, 163, 184, 255, 1)
    b.draw_line(28, 12, 36, 16, 255, 255, 255, 255, 1)
    b.draw_line(28, 16, 36, 12, 255, 255, 255, 255, 1)
    b.save_png(f"{base_dir}/farm_wheat.png")

    # Fazenda de Milho
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (22, 101, 52), (20, 83, 45))
    for offset in [-8, 0, 8]:
        b.draw_line(20 + offset, 44, 36 + offset, 52, 250, 204, 21, 255, 1)
    b.draw_iso_box(20, 42, 12, 6, 18, (203, 213, 225), (148, 163, 184), (100, 116, 139))
    b.save_png(f"{base_dir}/farm_corn.png")

    # Plantação de Algodão
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (22, 101, 52), (20, 83, 45))
    b.draw_circle(24, 46, 3, 255, 255, 255)
    b.draw_circle(36, 48, 3, 255, 255, 255)
    b.draw_circle(44, 42, 3, 255, 255, 255)
    b.draw_iso_box(26, 40, 20, 10, 10, (180, 83, 9), (146, 64, 14), (120, 53, 15))
    b.save_png(f"{base_dir}/farm_cotton.png")

    # Plantação de Café / Cacau / Cana
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (69, 26, 3), (41, 15, 2))
    b.draw_circle(20, 44, 4, 21, 128, 61)
    b.draw_circle(44, 44, 4, 21, 128, 61)
    b.draw_iso_box(32, 42, 22, 11, 12, (217, 119, 6), (180, 83, 9), (146, 64, 14))
    b.save_png(f"{base_dir}/farm_plantation.png")

    # Pecuária Bovina & Curral
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (21, 128, 61), (15, 23, 42))
    b.draw_iso_diamond(32, 48, 48, 24, (21, 128, 61), (180, 83, 9))
    b.draw_circle(26, 46, 2, 255, 255, 255)
    b.draw_circle(38, 48, 2, 30, 41, 59)
    b.draw_circle(34, 42, 2, 255, 255, 255)
    b.draw_iso_box(20, 40, 16, 8, 10, (185, 28, 28), (153, 27, 27), (127, 29, 29))
    b.save_png(f"{base_dir}/farm_cattle.png")

    # Pecuária Leiteira & Estábulo
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (21, 128, 61), (15, 23, 42))
    b.draw_iso_box(32, 44, 30, 15, 14, (248, 250, 252), (226, 232, 240), (203, 213, 225))
    b.draw_iso_roof_pitched(32, 44, 30, 15, 14, 8, (59, 130, 246), (29, 78, 216))
    b.save_png(f"{base_dir}/farm_dairy.png")

    # Fazenda Agropecuária Padrão
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (234, 179, 8), (161, 98, 7))
    b.draw_iso_box(32, 46, 32, 16, 14, (185, 28, 28), (153, 27, 27), (127, 29, 29))
    b.draw_iso_roof_pitched(32, 46, 32, 16, 14, 8, (254, 240, 138), (250, 204, 21))
    b.save_png(f"{base_dir}/farm_default.png")

# ------------------------------------------------------------------------------
# 6. MINAS & EXTRAÇÃO (client/assets/minas/)
# ------------------------------------------------------------------------------
def generate_mines():
    print("\n--- Gerando Sprites de Minas & Recursos ---")
    base_dir = "client/assets/minas"

    # Mina de Minério de Ferro
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (58, 58, 66), (20, 20, 25))
    b.draw_iso_box(32, 48, 38, 19, 16, (120, 53, 15), (146, 64, 14), (180, 83, 9))
    b.draw_iso_box(20, 42, 14, 7, 22, (248, 113, 113), (239, 68, 68), (185, 28, 28))
    b.draw_iso_box(42, 46, 8, 4, 5, (100, 116, 139), (71, 85, 105), (51, 65, 85))
    b.save_png(f"{base_dir}/mine_iron.png")

    # Poço de Petróleo (Bomba Cavalo-de-pau / Pumpjack)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(32, 48, 40, 20, 6, (71, 85, 105), (51, 65, 85), (30, 41, 59))
    b.draw_line(32, 42, 32, 18, 56, 189, 248, 255, 2)
    b.draw_line(22, 20, 42, 16, 2, 132, 199, 255, 3)
    b.draw_circle(20, 22, 3, 2, 132, 199)
    b.save_png(f"{base_dir}/mine_oil.png")

    # Mina de Bauxita & Sílica (Pedreira)
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (140, 120, 71), (70, 60, 35))
    b.draw_iso_box(32, 46, 36, 18, 12, (214, 211, 209), (168, 162, 158), (120, 113, 108))
    b.save_png(f"{base_dir}/mine_bauxite.png")

    # Mina de Ouro Nobre
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (58, 58, 66), (20, 20, 25))
    b.draw_iso_box(32, 48, 36, 18, 20, (251, 191, 36), (217, 119, 6), (180, 83, 9))
    b.draw_circle(32, 24, 4, 254, 240, 138)
    b.save_png(f"{base_dir}/mine_gold.png")

    # Silvicultura / Manejo Florestal
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (21, 128, 61), (15, 23, 42))
    b.draw_circle(20, 42, 5, 20, 83, 45)
    b.draw_circle(44, 42, 5, 20, 83, 45)
    b.draw_circle(32, 36, 6, 20, 83, 45)
    b.draw_iso_box(32, 48, 16, 8, 6, (146, 64, 14), (120, 53, 15), (99, 44, 12))
    b.save_png(f"{base_dir}/mine_timber.png")

# ------------------------------------------------------------------------------
# 7. LOGÍSTICA & MÍDIA (client/assets/logistica_midia/)
# ------------------------------------------------------------------------------
def generate_logistics_media():
    print("\n--- Gerando Sprites de Logística & Mídia ---")
    base_dir = "client/assets/logistica_midia"

    # Terminal Portuário de Contêineres
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 60, 30, (71, 85, 105), (15, 23, 42))
    b.draw_iso_box(24, 44, 24, 12, 14, (251, 191, 36), (217, 119, 6), (180, 83, 9))
    b.draw_line(44, 46, 44, 18, 234, 179, 8, 255, 2)
    b.draw_line(36, 18, 52, 18, 234, 179, 8, 255, 2)
    b.draw_iso_box(44, 30, 8, 4, 4, (59, 130, 246), (37, 99, 235), (29, 78, 216))
    b.save_png(f"{base_dir}/seaport.png")

    # Emissora de Televisão & Antenas
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 58, 29, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(32, 48, 40, 20, 20, (192, 132, 252), (147, 51, 234), (126, 34, 206))
    b.draw_line(32, 24, 32, 6, 226, 232, 240, 255, 2)
    b.draw_circle(32, 5, 2, 239, 68, 68)
    b.save_png(f"{base_dir}/media_tv.png")

    # Antena Transmissora de Rádio FM
    b = ImageBuffer(64, 64)
    b.draw_iso_diamond(32, 48, 56, 28, (30, 41, 59), (15, 23, 42))
    b.draw_iso_box(32, 48, 24, 12, 10, (100, 116, 139), (71, 85, 105), (51, 65, 85))
    b.draw_line(32, 36, 32, 4, 244, 63, 94, 255, 2)
    b.draw_line(26, 12, 38, 12, 244, 63, 94, 255, 1)
    b.save_png(f"{base_dir}/media_radio.png")

# ------------------------------------------------------------------------------
# 8. TERRENOS BASE (client/assets/terrenos/)
# ------------------------------------------------------------------------------
def generate_terrains():
    print("\n--- Gerando Sprites de Terrenos ---")
    base_dir = "client/assets/terrenos"

    # Grama Plana
    b = ImageBuffer(64, 32)
    b.draw_iso_diamond(32, 16, 64, 32, (15, 41, 30), (10, 30, 20))
    b.save_png(f"{base_dir}/grass.png")

    # Solo Fértil Agrícola
    b = ImageBuffer(64, 32)
    b.draw_iso_diamond(32, 16, 64, 32, (25, 66, 38), (18, 50, 28))
    b.draw_line(16, 16, 48, 16, 20, 55, 30, 255, 1)
    b.save_png(f"{base_dir}/fertile_soil.png")

    # Praia & Areia Dourada
    b = ImageBuffer(64, 32)
    b.draw_iso_diamond(32, 16, 64, 32, (140, 120, 71), (110, 95, 55))
    b.save_png(f"{base_dir}/sand.png")

    # Água Rasa Costeira
    b = ImageBuffer(64, 32)
    b.draw_iso_diamond(32, 16, 64, 32, (7, 50, 82), (5, 38, 62))
    b.save_png(f"{base_dir}/water_shallow.png")

    # Oceano Profundo
    b = ImageBuffer(64, 32)
    b.draw_iso_diamond(32, 16, 64, 32, (3, 30, 51), (2, 20, 35))
    b.save_png(f"{base_dir}/water_deep.png")

    # Colina Verde
    b = ImageBuffer(64, 48)
    b.draw_iso_diamond(32, 32, 64, 32, (59, 58, 42), (40, 40, 30))
    b.draw_circle(32, 24, 12, 59, 58, 42)
    b.save_png(f"{base_dir}/hill.png")

    # Montanha Rochosa
    b = ImageBuffer(64, 48)
    b.draw_iso_diamond(32, 32, 64, 32, (58, 58, 66), (40, 40, 48))
    pts_m = [(16, 32), (32, 10), (48, 32), (32, 38)]
    b.fill_polygon(pts_m, 100, 116, 139)
    pts_s = [(28, 16), (32, 10), (36, 16), (32, 18)]
    b.fill_polygon(pts_s, 248, 250, 252)
    b.save_png(f"{base_dir}/mountain.png")


def main():
    generate_stores()
    generate_companies()
    generate_houses()
    generate_roads()
    generate_farms()
    generate_mines()
    generate_logistics_media()
    generate_terrains()
    print("\n[OK] Todos os sprites foram gerados com sucesso em client/assets/!")

if __name__ == "__main__":
    main()
